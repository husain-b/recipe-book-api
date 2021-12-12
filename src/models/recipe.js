const mongoose = require('mongoose');


const recipeSchema = mongoose.Schema({
    name :{
        type : String,
        trim : true
    },
    imageUrl : {
        type : String,
        trim : true,
    },
    ingredients : [{
        name : {
            type : String,
            trim : true
        },
        amount : {
            type : Number
        }
    }],
    owner : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User',
        required : true
    }
},
    {timestamps : true}
)

const Recipe = mongoose.model('recipe',recipeSchema)

module.exports = Recipe