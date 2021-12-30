const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth')
const Recipe = require('../models/recipe')
const User = require('../models/user')

router.get('/recipes',auth,async (req,res)=>{
    try{
         await req.user.populate('recipes')
        //  let recipeIds = req.user.recipes.map(recipe => recipe._id.toString())
        //  let promises = recipeIds.map(recipeId => {
        //      return Recipe.findOne({_id : recipeId})
        //  })
        // let recipes = await Promise.all(promises)
         res.send(req.user.recipes)
    }catch(e){
        res.status(500).send('Internal server error')
    }
})

router.put('/recipes',auth,async(req,res)=>{
    try{
        await Recipe.deleteMany({owner : req.user._id});
        const recipes = req.body;
        recipes.forEach(async recipe=>{
            await new Recipe({...recipe,owner : req.user._id}).save()           
        })       
        res.status(201).send()
    }catch(e){
        res.status(500).send('Internal Server Error')
    }
})

module.exports = router