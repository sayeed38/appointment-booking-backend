const fireBase = require("firebase-admin");
var serviceAccount = require("./utils/ServiceAccountKey.json");

fireBase.initializeApp({
  credential: fireBase.credential.cert(serviceAccount),
});

const db = fireBase.firestore();

module.exports = db;