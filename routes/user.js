const express = require("express");
const router = express.Router();
const con = require("../config/dbconn");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const middleware = require("../middleware/authorization");
const bodyParser = require('body-parser');

//gets users from database
router.get("/", (_req, res) => {
  try {
    con.query("SELECT * FROM users", (err, result) => {
      if (err) throw err;
      res.send(result);
    });
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

// Register Route
// The Route where Encryption starts
// router.post("/users", (req, res) => {
//   try {
//     let sql = "INSERT INTO users SET ?";
//     const {
//       fullname,
//       email,
//       password,
//       phonenumber
//     } = req.body;

//     // The start of hashing / encryption
//     const salt = bcrypt.genSaltSync(10);
//     const hash = bcrypt.hashSync(password, salt);

//     let user = {
//       fullname,
//       email,
//       // We sending the hash value to be stored witin the table
//       password: hash,
//       phonenumber
//     };
//     con.query(sql, user, (err, result) => {
//       if (err) throw err;
//       console.log(result);
//       res.send(`User ${(user.fullname, user.email)} created successfully`);
//     });
//   } catch (error) {
//     console.log(error);
//   }
// });


// REGISTER USER
router.post('/users', bodyParser.json(), async(req, res)=>{
  let bd = req.body
  const emailQ = `
      SELECT email FROM users WHERE ?
  `
  let email = {
      email: req.body.email
  }

  con.query(emailQ, email, async(err, result)=>{
      if (err) throw err
      // VALIDATION
      if (result.length > 0) {
          res.json({
              status: 400,
              msg: "The provided email exists. Please enter another one",
              
          })
      } else {
          let generateSalt = await bcrypt.genSalt()
          req.body.password = await bcrypt.hash(req.body.password, generateSalt)
          let date = {
              // date: new Date().toLocaleDateString(),
              date: new Date().toISOString().slice(0, 10)
            };
          bd.join_date = date.date;  

          const registerQ = `
              INSERT INTO users(fullname, email, password, phonenumber)
              VALUES(?, ?, ?, ?)
          `
      
          db.query(registerQ, [bd.fullname, bd.email, bd.password, bd.phonenumber], (err, result)=>{
              if (err) throw err
              const payload = {
                  user: {
                      fullname: bd.fullname,
                      email: bd.email,
                      password: bd.password,
                      phonenumber: bd.phonenumber
                  }
              };

              jwt.sign(payload, process.env.jwtsecret, {expiresIn: "7d"}, (err, token)=>{
                  if (err) throw err
                  res.json({
                      status: 200,
                      msg: 'Registration Successful',
                      token: token,
                      users: result
                  })
              })
          })
          
      }
  })

})





/******************************************************************************************************* */
// Login
// The Route where Decryption happens
router.post("/login", (req, res) => {
  try {
    let sql = "SELECT * FROM users WHERE ?";
    let user = {
      email: req.body.email,
    };
    con.query(sql, user, async (err, result) => {
      if (err) throw err;
      if (result.length === 0) {
        res.send("Email not found please register");
      } else {
        const isMatch = await bcrypt.compare(
          req.body.password,
          result[0].password
        );
        if (!isMatch) {
          res.send("Password incorrect");
        } else {
          // The information the should be stored inside token
          const payload = {
            user: {
              id: result[0].id,
              fullname: result[0].fullname,
              email: result[0].email,
              phonenumber: result[0].phonenumber
            },
          };
          // Creating a token and setting expiry date
          jwt.sign(
            payload,
            process.env.jwtSecret,
            {
              expiresIn: "365d",
            },
            (err, token) => {
              if (err) throw err;
              res.json({ token });
            }
          );
        }
      }
    });
  } catch (error) {
    console.log(error);
  }
});

//Delete user
router.delete('/:id', (req, res)=>{
  const deleteUser = `
      DELETE FROM users WHERE id = ${req.params.id};
  `

  con.query(deleteUser, (err, result)=>{
      if (err) throw err
      res.json({
          status: 204,
          msg: 'User Deleted Successfully',
          users: result
      })
  })
})

// Verify
router.get("/verify", (req, res) => {
  const token = req.header("x-auth-token");
  jwt.verify(token, process.env.jwtSecret, (error, decodedToken) => {
    if (error) {
      res.status(401).json({
        msg: "Unauthorized Access!",
      });
    } else {
      res.status(200);
      res.send(decodedToken);
    }
  });
});

router.get("/", middleware, (_req, res) => {
  try {
    let sql = "SELECT * FROM users";
    con.query(sql, (err, result) => {
      if (err) throw err;
      res.send(result);
    });
  } catch (error) {
    console.log(error);
  }
});

router.get("/:id", (req, res) => {
  try {
    con.query(
      `SELECT * FROM users WHERE id = "${req.params.id}"`,
      (err, result) => {
        if (err) throw err;
        res.send(result);
      }
    );
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});
// Edit
router.put('/:id', bodyParser.json(), async(req, res)=>{
  const body = req.body
  const edit = `
      UPDATE users
      SET fullname = ?, email = ?, phonenumber = ?, password = ?
      WHERE id = ${req.params.id}
  `

  let generateSalt = await bcrypt.genSalt()
  body.password = await bcrypt.hash(body.password, generateSalt)
  db.query(edit, [body.username, body.emailAddress, body.phone_number, body.password], (err, result)=>{
      if (err) throw err
      res.json({
          status: 204,
          msg: 'User has been edited successfully',
          users: result
      })
  })
})

module.exports = router;