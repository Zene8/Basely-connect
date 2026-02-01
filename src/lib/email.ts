import { Resend } from 'resend';

export async function sendMatchEmail(username: string, matches: { companyName: string; score: number }[]) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set. Skipping email.");
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const matchRows = matches
    .map(m => `<li><strong>${m.companyName}</strong>: ${m.score.toFixed(2)}%</li>`)
    .join('');

  try {
    await resend.emails.send({
      from: 'Basely Connect <onboarding@resend.dev>', // Default Resend test address
      to: 'nathan@basely.co.uk',
      subject: `New Match Results: ${username}`,
      html: `
        <h2>Match Results for ${username}</h2>
        <p>The following matches were generated:</p>
        <ul>
          ${matchRows}
        </ul>
        <p>View full details in the dashboard.</p>
      `,
    });
  } catch (error) {
    console.error("Failed to send email:", error);
  }
}
