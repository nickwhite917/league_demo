const bcrypt = require('bcrypt-nodejs');
const crypto = require('crypto');
const mongoose = require('mongoose');
console.log("user.js");
var zipcodes = require('zipcodes');

const userSchema = new mongoose.Schema({

  //Primary attributes - not used in matching process
  email: { type: String, unique: true },
  password: String,
  passwordResetToken: String,
  passwordResetExpires: Date,

  //API Information
  facebook: String,
  twitter: String,
  google: String,
  github: String,
  instagram: String,
  linkedin: String,
  steam: String,
  tokens: Array,

  //Personal profile - used in matching process
  profile: {
    name: { type: String, default: '' },
    age: { type: String, default: '' },
    gender: { type: String, default: '' },
    religion: { type: String, default: '' },
    zip: {
      type: Number,
      default: [0]
    },
    website: { type: String, default: '' },
    picture: { type: String, default: '' }
  },

  //Personal preferences - used in matching process
  preferences: {
    ageRangeLow: { type: String, default: '18' },
    ageRangeHigh: { type: String, default: '65' },
    distance: { type: Number, default: 20 },
    gender: { type: String },
    religion: { type: [] }
  },

  //Personal matches
  matches: {
    type: []
  }
}, { timestamps: true });

/**
 * Password hash middleware.
 */
userSchema.pre('save', function (next) {
  const user = this;
  if (!user.isModified('password')) { return next(); }
  bcrypt.genSalt(10, (err, salt) => {
    if (err) { return next(err); }
    bcrypt.hash(user.password, salt, null, (err, hash) => {
      if (err) { return next(err); }
      user.password = hash;
      next();
    });
  });
});

/**
 * Helper method for validating user's password.
 */
userSchema.methods.comparePassword = function (candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
    cb(err, isMatch);
  });
};

/**
 * Helper method for getting user's gravatar.
 */
userSchema.methods.gravatar = function (size) {
  if (!size) {
    size = 200;
  }
  if (!this.email) {
    return `https://gravatar.com/avatar/?s=${size}&d=retro`;
  }
  const md5 = crypto.createHash('md5').update(this.email).digest('hex');
  return `https://gravatar.com/avatar/${md5}?s=${size}&d=retro`;
};

/*
* Updates matches when user is added, updated, or deleted.
*/
// userSchema.methods.updateMatches = function (updateType) {
//   //Get current user reference
//   var thisUser = this;
//   // if (updateType) {
//   //   if (updateType == "create") {
//   //     createInitialMatches(thisUser);
//   //   }
//   //   if (updateType == "update") {
//   //     updateExistingMatches(thisUser);
//   //   }
//   //   if (updateType == "delete") {
//   //     deleteExistingMatches(thisUser);
//   //   }
//   // }
// };
userSchema.methods.preferencesAreValidated = function () {
  var validated = false;
  if (this.preferences.ageRangeLow != undefined
    && this.preferences.ageRangeHigh != undefined
    && this.preferences.distance != undefined
    && this.preferences.gender != undefined
    && this.preferences.religion.length > 0
    && this.profile.zip != 0
  ) {
    validated = true;
  }
  return validated;
}

userSchema.methods.getUsersThatMatchMyPreferences = function (cb) {
  var thisUser = this;
  var query = User.find({});
  query.where('profile.age').gte(thisUser.preferences.ageRangeLow).lte(thisUser.preferences.ageRangeHigh);
  query.where('profile.gender').equals(thisUser.preferences.gender);
  query.where('profile.religion').in([thisUser.preferences.religion[0], 'Unspecified']);

  query.exec(function (err, matches) {
    var matchesInDistance = [];
    console.log("About to test matches for distance...");
    matches.forEach(function(match){
      if(zipcodes.distance(match.profile.zip,thisUser.profile.zip) <= thisUser.preferences.distance){
        matchesInDistance.push(match);
      }
    });
    cb(matchesInDistance);
  });
  // .where('profile.age').gt(thisUser.preferences.ageRangeLow).lt(thisUser.preferences.ageRangeHigh)
  // .where('profile.gender').equals(thisUser.preferences.gender)
  // .where('profile.religion').equals(thisUser.preferences.religion[0])
  //     .exec(function (err, users) {
  //       // //We now have a list of users that match this person's preferences.'
  //       // users.forEach(function (user) {
  //       //   //Add this user to their matches if this user qualifies
  //       //   console.log(user);
  //       // });
  //       cb(users);
  //     });
};

const User = mongoose.model('User', userSchema);

module.exports = User;

// function createInitialMatches(thisUser) {
//   //Find users that match my preferences
//   var users = getUsersThatMatchMyPreferences(thisUser);
//   //Eliminate the ones that don't match my profile
//   var users = users.forEach((usr) => {
//     if (!profilesMatch(thisUser, usr)) {
//       remove_item(users, thisUser._id);
//     } else {
//       //Add me to their matches, and them to my matches
//       addMatches(thisUser, usr);
//     }
//   });
// };

// function updateExistingMatches(user) {
//   //Find users that match my new preferences

//   //Eliminate the ones that don't match my profile

//   //Remove my preferences, build with new list

//   //Add me to theirs if not present



//   var thisUsersMatches = User.find(
//     {
//       matches: user._id
//     }
//   ).exec(function (err, results) {
//     results.forEach(function (resultingUser) {
//       console.log(resultingUser);
//       if (profilesMatch(resultingUser, user)) {
//         //add match to both if not exists
//         addMatches(resultingUser, user);
//       }
//       else {
//         remove_item(resultingUser.matches, user._id);
//       }
//     });
//   });
// };

// function deleteExistingMatches(user) {
//   User.find(
//     {
//       matches: user._id
//     }
//   ).exec(function (err, results) {
//     results.forEach(function (resultingUser) {
//       console.log(resultingUser);
//       remove_item(resultingUser.matches, user._id);
//     });
//   });
// };

// remove_item = function (arr, value) {
//   var b = '';
//   for (b in arr) {
//     if (arr[b] === value) {
//       arr.splice(b, 1);
//       break;
//     }
//   }
//   return arr;
// }

// function profilesMatch(user1, user2) {
//   if (user1 && user2) {
//     if (user1.profile.gender == user2.preferences.gender
//       && user1.profile.religion == user2.preferences.relgion
//       && user1.profile.age > user2.preferences.ageRangeLow
//       && user1.profile.age < user2.preferences.ageRangeHigh) {
//       if (user2.profile.gender == user1.preferences.gender
//         && user2.profile.religion == user1.preferences.relgion
//         && user2.profile.age > user1.preferences.ageRangeLow
//         && user2.profile.age < user1.preferences.ageRangeHigh) {
//         return true;
//       }
//     }
//   } else {
//     return false;
//   }
// }

// function addMatches(user1, user2) {
//   upsertMatch(user1, user2);
//   upsertMatch(user2, user1);
// }

// function upsertMatch(user1, user2) {
//   var found = false;
//   for (var i = 0; i < user1.matches.length; i++) {
//     var element = user1.matches[i];
//     if (element == user2._id) {
//       found = true;
//     }
//   }
//   if (!found) {
//     user1.matches.push(user2._id);
//   }
// }