/**
 * Code exported from Paper
 * https://app.paper.design/file/01KDJ1HYKTJE11XMETSJEW1468?node=01KDJ489X01DC5WRMX5MFJCXF3
 * on Dec 28, 2025 at 2:45 PM.
 */
export default function StyledText({ children, style }) {
  return (
    <div className="hero-styled" style={{ 
      boxSizing: 'border-box', 
      color: 'white', 
      fontSize: '4rem', // Responsive font size
      lineHeight: '1.2',
      textAlign: 'center',
      ...style 
    }}>
      {children}
    </div>
  );
}
