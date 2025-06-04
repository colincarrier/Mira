function BasicTest() {
  return (
    <div style={{ padding: "20px", fontFamily: "system-ui" }}>
      <h1>Basic React Test</h1>
      <p>If this renders, React is working properly.</p>
      <div style={{ marginTop: "20px" }}>
        <button onClick={() => alert("Button works!")}>
          Test Button
        </button>
      </div>
    </div>
  );
}

export default BasicTest;