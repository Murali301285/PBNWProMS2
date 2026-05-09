const crypto = require('crypto');

function EncryptNumber(str) {
    const key = "rytTHh42t5Aagite95R95erktlwe454asR1254fase5454un5g45Ka8vg54d45Sa5astg";
    
    // MD5 hash of the key exactly like C#
    const hashmd5 = crypto.createHash('md5');
    hashmd5.update(Buffer.from(key, 'utf8'));
    const keyArray = hashmd5.digest(); // 16 bytes

    // Triple DES (des-ede-ecb is ECB mode with a 16 byte key, exactly matching .NET's TripleDes with 16 byte key)
    const cipher = crypto.createCipheriv('des-ede-ecb', keyArray, null);
    cipher.setAutoPadding(true); // PKCS7 is the default in Node.js

    let encrypted = cipher.update(str, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
}

function DecryptNumber(str) {
    const key = "rytTHh42t5Aagite95R95erktlwe454asR1254fase5454un5g45Ka8vg54d45Sa5astg";
    
    const hashmd5 = crypto.createHash('md5');
    hashmd5.update(Buffer.from(key, 'utf8'));
    const keyArray = hashmd5.digest(); 

    const decipher = crypto.createDecipheriv('des-ede-ecb', keyArray, null);
    decipher.setAutoPadding(true);

    let decrypted = decipher.update(str, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

try {
    const testPW = "mypassword123";
    const encrypted = EncryptNumber(testPW);
    console.log("Encrypted:", encrypted);
    
    const decrypted = DecryptNumber(encrypted);
    console.log("Decrypted:", decrypted);
    
    console.log("Success:", decrypted === testPW);
} catch(e) {
    console.error(e);
}
