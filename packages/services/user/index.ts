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
    console.log(hash);
    console.log(existingUser.password);
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
}

export default UserService;
