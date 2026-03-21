export const metadata = { title: 'Johnstown Kitchens — Content Intelligence' };
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant:wght@400;500;600;700&family=Josefin+Sans:wght@300;400;500;600;700&family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <style>{`*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}body{font-family:'Josefin Sans',sans-serif;background:#faf8f5;color:#1e1e1e}`}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
