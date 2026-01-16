export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-contract="page-container"
      style={{
        maxWidth: "1400px",
        paddingLeft: "24px",
        paddingRight: "24px",
      }}
    >
      {children}
    </div>
  );
}
