export const environment = {
  production: false,
  // API_BASE_URL: 'https://backend.taamid.shop/api',
  // url: 'https://backend.taamid.shop/storage/',
  API_BASE_URL: 'http://192.168.1.113:8000/api',
  url: 'http://192.168.1.113:8000/storage/',
  pusher: {
    key: 'b52118108b752ba9fb90', // استبدل بالمفتاح الصحيح
    cluster: 'ap2',
    appId: '1978700', // إضافة appId إذا كنت بحاجة إليه
  },
  firebaseConfig: {
    apiKey: 'AIzaSyBVW773absjeZtxaXYlrrIYv_4NRy47vVw',
    authDomain: 'middle-east-e7811.firebaseapp.com',
    projectId: 'middle-east-e7811',
    storageBucket: 'middle-east-e7811.firebasestorage.app',
    messagingSenderId: '352782077613',
    appId: '1:352782077613:web:414d3b77be6827a54b8024',
    measurementId: 'G-6QGKXT4R08',
  },
};
