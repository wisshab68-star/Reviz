export default function Loading() {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          fontSize: "24px",
          fontWeight: 900,
          color: "#000000",
          letterSpacing: "-0.02em",
        }}
      >
        REVIZ
      </div>
    </div>
  );
}
