// should only contain beginning routes
const config = require('../../config');

// Middleware
const router = require('express').Router();

// register api credentials
router.post('/register', (req, res) => {

  // validate api-register-password
  if(req.body.apiRegisterPwd !== config.apiRegisterPwd) {
    return res.status(403).json({
      message: "Invalid api register credentials"
    });
  }

  // function to get random string
  function randomStr() {
    var randLen = Math.floor(Math.random() * 20) + 1;
    var arr = '01234569870abcdefghijklmnopqrstuvwxyz';
    var ans = '';
    for (var i = randLen; i > 0; i--) {
      ans +=
        arr[Math.floor(Math.random() * arr.length)];
    }
    return ans;
  }

  // call random string function // save string to pass back for api key & secret
  const salt = await bcrypt.genSalt(10);
  const genStr = randomStr();
  const kid = randomStr();
  const secret = await bcrypt.hash(genStr, salt);
  const source = req.body.source;
  const secretType = req.body.secretType;

  // genStr to client | hashStr to db
  const newApiKey = new ApiKey({
    kid,
    secret,
    source,
    secretType
  });

  newApiKey.save()
  .then(newApiKey => {
    res.status(200).json({
      kid: newApiKey.kid,
      secret: newApiKey.secret
    });
  })
  .catch(err => {
    res.status(500).json({
      message: "There was an error trying to register the new api credentials",
      err
    });
    console.error({
      message: "There was an error trying to register the new api credentials",
      err
    });
  });

});

module.exports = router;