// หน้าชั่วคราว แสดงแค่หัวข้อตามบอร์ด จะแทนที่ทีละหน้าในขั้นถัดไป
const TITLES = { today: 'สวัสดี บลู', calendar: 'ปฏิทิน', sides: 'แยกด้าน', settings: 'ตั้งค่า' };
export const placeholder = id => `<h1 class="h-page">${TITLES[id]}</h1>`;
