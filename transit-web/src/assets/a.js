// Create a data URL for a simple bus stop icon
const svgString = `
<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="8" fill="#EF4444" stroke="white" stroke-width="2"/>
</svg>
`;

const busStopIconUrl = `data:image/svg+xml;base64,${btoa(svgString)}`;
export default busStopIconUrl; 