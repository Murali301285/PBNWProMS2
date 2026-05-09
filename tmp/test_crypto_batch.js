const crypto = require('crypto');

function EncryptNumber(str) {
    const key = "rytTHh42t5Aagite95R95erktlwe454asR1254fase5454un5g45Ka8vg54d45Sa5astg";
    
    const hashmd5 = crypto.createHash('md5');
    hashmd5.update(Buffer.from(key, 'utf8'));
    const keyArray = hashmd5.digest(); 

    const cipher = crypto.createCipheriv('des-ede-ecb', keyArray, null);
    cipher.setAutoPadding(true); 

    let encrypted = cipher.update(str, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
}

const targets = [
    "Sukesh@123",
    "Sitanshi!2024",
    "yps@2026",
    "Manoj@2005",
    "Pr0M$2026#"
];

targets.forEach(t => {
    console.log(t + "  ->  " + EncryptNumber(t));
});
