import {db,eq} from '@repo/database'
import {usersTable} from '@repo/database/models/user'
import {randomBytes,createHmac} from 'node:crypto'
import { type CreateUserWithEmailAndPasswordType,
   createUserWithEmailAndPasswordInput,
   generateUserTokenPayload, 
   GenerateUserTokenPayloadType,  
   signInUserWithEmailAndPasswordInput,  
   SignInUserWithEmailAndPasswordType} from "./model";
import * as JWT from 'jsonwebtoken'
import { env } from '../env';

class UserService {

  private async generateHash(salt:string,password:string){
    return createHmac('sha256',salt).update(password).digest('hex');
  }

  private async getUserInfoById(id:string){
    const user = await db.select({
      id:usersTable.id,
      email:usersTable.email,
      fullName: usersTable.fullName,
      profileImageUrl: usersTable.profileImageUrl,
    }).from(usersTable).where(eq(usersTable.id,id));

    if(!user || user.length===0) throw new Error('User not found');
    return user[0];
  }
   
  private async getUserByEmail(email:string){
    const result = await db.select().from(usersTable).where(eq(usersTable.email,email));
    if(!result || result.length ===0) return null;
    return result[0];
  }

  private async generateUserToken(payload: GenerateUserTokenPayloadType){
    const {id} = await generateUserTokenPayload.parseAsync(payload);
    const token = JWT.sign(
      {id},
      env.JWT_SECRET
    );
    return {token};
  }

  private async verifyUserToken(token:string):Promise<GenerateUserTokenPayloadType>{
    try {
      const verificationResult = JWT.verify(token,env.JWT_SECRET) as GenerateUserTokenPayloadType;
      return verificationResult;
    } catch (error) {
      throw new Error('Invalid Token');
    }
    
  }

  public async createUserWithEmailAndPassword(payload:CreateUserWithEmailAndPasswordType){
    const {fullName,email,password} = await createUserWithEmailAndPasswordInput.parseAsync(payload);
    const existingUserWithEmail = await this.getUserByEmail(email);
    if(existingUserWithEmail){
      throw new Error('User with given email already exists');
    }
    const salt = randomBytes(16).toString('hex');
    const hash =await this.generateHash(salt,password);

    const userInsertResult = await db.insert(usersTable).values({email,fullName,password:hash,salt}).returning({
      id: usersTable.id
    });
    if(!userInsertResult || userInsertResult.length===0 || !userInsertResult[0]?.id) throw new Error('Error creating a user');
    const userId =  userInsertResult[0]?.id
    const {token} = await this.generateUserToken({id:userId})

    return {
      id: userId,
      token
    }
  }

  public async signinUserWithEmailAndPassword(payload: SignInUserWithEmailAndPasswordType){
    const {email,password} = await signInUserWithEmailAndPasswordInput.parseAsync(payload);
    const existingUser = await this.getUserByEmail(email);
    if(!existingUser){
      throw new Error('Invalid Username or Password');
    }
    if(!existingUser.password || !existingUser.salt){
      throw new Error('Invalid Authentication Method');
    }

    const hash = await this.generateHash(existingUser.salt,password);

    if(hash!==existingUser.password){
      throw new Error('Invalid Username or Password');
    }

    const userId = existingUser.id;

    const {token} = await this.generateUserToken({id:userId})
    return {
      id:userId,
      token
    }
  }

  public async verifyAndDecodeUserToken(token:string){
    const {id} = await this.verifyUserToken(token);
    const userInfo = await this.getUserInfoById(id);
    return {
      ...userInfo
    };
  }

  // ─── Google OAuth ────────────────────────────────────

  public generateGoogleOAuthUrl() {
    const { googleOAuth2Client } = require('../clients/google-oauth');
    
    // Fallback if client is missing credentials (e.g. env vars not set)
    if (!env.GOOGLE_OAUTH_CLIENT_ID) {
      throw new Error("Google OAuth is not configured");
    }

    return googleOAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['openid', 'email', 'profile'],
      response_type: 'code',
      prompt: 'consent'
    });
  }

  public async signInWithGoogleAuthorizationCode(payload: { code: string }) {
    const { googleOAuth2Client } = require('../clients/google-oauth');

    if (!env.GOOGLE_OAUTH_CLIENT_ID) {
      throw new Error("Google OAuth is not configured");
    }

    // Exchange code for tokens
    const { tokens } = await googleOAuth2Client.getToken(payload.code);
    
    if (!tokens.id_token) {
      throw new Error("No ID token received from Google");
    }

    // Verify ID token
    const ticket = await googleOAuth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: env.GOOGLE_OAUTH_CLIENT_ID,
    });

    const payloadProfile = ticket.getPayload();
    if (!payloadProfile || !payloadProfile.email) {
      throw new Error("Invalid Google profile payload");
    }

    const user = await this.findOrCreateGoogleUser({
      email: payloadProfile.email,
      name: payloadProfile.name || payloadProfile.email.split('@')[0] || 'User',
      picture: payloadProfile.picture || null,
      email_verified: payloadProfile.email_verified || false,
    });

    const { token } = await this.generateUserToken({ id: user.id });

    return {
      id: user.id,
      token
    };
  }

  private async findOrCreateGoogleUser(profile: {
    email: string;
    name: string;
    picture: string | null;
    email_verified: boolean;
  }) {
    const existingUser = await this.getUserByEmail(profile.email);

    if (existingUser) {
      // Set emailVerified = true, update avatar if empty
      const updateData: any = { emailVerified: true };
      if (!existingUser.profileImageUrl && profile.picture) {
        updateData.profileImageUrl = profile.picture;
      }
      
      await db.update(usersTable)
        .set(updateData)
        .where(eq(usersTable.id, existingUser.id));

      return existingUser;
    } else {
      // Create new user with null password/salt
      const userInsertResult = await db.insert(usersTable).values({
        email: profile.email,
        fullName: profile.name,
        profileImageUrl: profile.picture,
        emailVerified: true,
        password: null,
        salt: null,
      }).returning({
        id: usersTable.id
      });

      if (!userInsertResult || userInsertResult.length === 0 || !userInsertResult[0]?.id) {
        throw new Error('Error creating a user from Google profile');
      }

      return {
        id: userInsertResult[0].id
      };
    }
  }

}

export default UserService;
