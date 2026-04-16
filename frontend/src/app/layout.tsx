import './globals.css';

export const metadata = {
  title: 'Matrix Image Cryptography',
  description: 'Encrypt and decrypt images using Matrix Transformations and SVD',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
