// สีลูกบอลอารมณ์ (ไฮไลต์อ่อนมุมซ้ายบน) · ใช้ร่วมกันหลายหน้า
export const tint = (hex, t = 0.47) => '#' + [1, 3, 5].map(i => Math.round(parseInt(hex.slice(i, i + 2), 16) + (255 - parseInt(hex.slice(i, i + 2), 16)) * t).toString(16).padStart(2, '0')).join('');
export const ball = hex => `radial-gradient(circle at 32% 28%,${tint(hex)} 0%,${hex} 72%)`;
