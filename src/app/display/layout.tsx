import Script from 'next/script'

export default function DisplayLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Script
        id="display-theme-init"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `(function(){var s=localStorage.getItem('celebboard-display-theme');document.documentElement.setAttribute('data-theme',s&&['dark','light','vibrant'].includes(s)?s:'dark');})();`,
        }}
      />
      {children}
    </>
  )
}
