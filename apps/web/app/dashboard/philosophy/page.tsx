export default function PhilosophyPage() {
  return (
    <div className="max-w-2xl mx-auto py-12 space-y-16">
      <header className="space-y-4">
        <h1 className="text-4xl font-serif text-inquest-ink tracking-tight">The Inquest Philosophy</h1>
        <p className="text-xl text-inquest-ink-mid leading-relaxed">
          Why we built this tool, and how we hope you use it.
        </p>
      </header>

      <div className="w-16 h-px bg-inquest-accent" />

      <article className="prose prose-stone max-w-none text-inquest-ink-mid text-lg leading-loose space-y-8">
        <p>
          We live in an era of infinite data collection. Most forms are designed to extract information as quickly and painlessly as possible. They use gamification, progress bars, and clinical interfaces to optimize completion rates.
        </p>

        <p>
          <strong>Inquest is different.</strong> We believe that asking a question is an invitation to reflect. When you send someone a form, you are asking for their time and their thought. The interface should reflect that respect.
        </p>

        <blockquote className="border-l-4 border-inquest-accent pl-6 py-2 my-10 italic text-2xl font-serif text-inquest-ink bg-inquest-surface/50 rounded-r-2xl">
          "A good question is never just about getting an answer. It's about opening a space for someone to think."
        </blockquote>

        <p>
          We designed Inquest with a "warm, human-centered, non-technical feel" to evoke the sensation of reading a thoughtful letter rather than filling out a bureaucratic spreadsheet. 
        </p>

        <h3 className="text-2xl font-serif text-inquest-ink mt-12 mb-4">Core Principles</h3>
        
        <ul className="space-y-4 list-disc pl-5">
          <li><strong>Respect the Respondent:</strong> Give them a beautiful, quiet space to compose their thoughts. No flashing distractions, no clinical utility.</li>
          <li><strong>Privacy by Default:</strong> Not every question is meant for the public square. The Secure Code system ensures that only the intended recipients can engage with your enquiry.</li>
          <li><strong>Simplicity:</strong> We removed complex conditional logic and multi-page branching. A single, focused page of questions yields the best answers.</li>
        </ul>

        <p className="pt-8">
          We hope Inquest helps you gather deeper insights and have better conversations.
        </p>
      </article>
    </div>
  );
}
