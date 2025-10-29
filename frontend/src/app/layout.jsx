import './globals.css'

export const metadata = {
  title: 'Buy-Sell Platform',
  description: 'Modern e-commerce platform for buying and selling products',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
