import './globals.css';

export const metadata = {
  title: 'GitMatch - Find Your Perfect Company Match',
  description: 'Analyze your GitHub profile and get matched with companies that align with your skills and interests.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="grid-overlay" />
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        {children}
      </body>
    </html>
  );
}
