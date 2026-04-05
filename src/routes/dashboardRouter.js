import express from 'express';
import { StatusCodes } from "http-status-codes";
import verifyJWT from "../middlewares/verifyTokenMiddleware.js";
import {getInsights} from "../utils/utils.js";
import { fetchRecordsByDateForUser,fetchRecordsByDate,fetchByCategoryForUser,fetchByCategory,fetchRecent,fetchRecentForUser,fetchAll,fetchAllForUser } from "../db/dbFunctions.js";



const router = express.Router();



router.get('/trends',verifyJWT,async(req,res)=>{
  try{
    const {type} = req.query;

    if (!["weekly", "monthly"].includes(type)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: "type must be weekly or monthly" });
    }

    const today = new Date();
    const fromDate = new Date();

    if (type === "weekly") {
      fromDate.setDate(today.getDate() - 7);
    } else if(type=="monthly") {
      fromDate.setMonth(today.getMonth() - 1);
    } else{
        return res.status(StatusCodes.BAD_REQUEST).json({ msg: `Invalid query param ${type}` });
    }

    let result ;
    if (req.role === "viewer") {
      result = await fetchRecordsByDateForUser(req.client, req.userId, fromDate);
    } else if (["analyst", "admin"].includes(req.role)) {
      result = await fetchRecordsByDate(req.client, fromDate);
    } else {
      return res.status(StatusCodes.FORBIDDEN).json({ msg: "Unauthorized" });
    }

    const records = result.rows;
    const insights = getInsights(records);

    return res.json({
      ...insights,
      transactions: records,
    });

  }catch(err){
    console.log('Error in showcasing dashboard trends',err)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({msg:'Error showcasing dashboard trends'})
  }
})


router.get("/categoryInsights", verifyJWT, async (req, res) => {
  try {
    const { category } = req.query;

    if (!category?.trim()) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Category required" });
    }

    let result;

    if (req.role === "viewer") {
      result = await fetchByCategoryForUser(req.client, req.userId, category);
    } else if (["analyst", "admin"].includes(req.role)) {
      result = await fetchByCategory(req.client, category);
    } else {
      return res.status(StatusCodes.FORBIDDEN).json({ msg: "Unauthorized" });
    }

    const records = result.rows;
    const insights = getInsights(records);

    return res.json({
      ...insights,
      transactions: records,
    });

  } catch (err) {
    console.log(err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: "Error in category insights" });
  }
});



router.get("/recentActivity", verifyJWT, async (req, res) => {
  try {
    let result;

    if (req.role === "viewer") {
      result = await fetchRecentForUser(req.client, req.userId);
    } else if (["analyst", "admin"].includes(req.role)) {
      result = await fetchRecent(req.client);
    } else {
      return res.status(StatusCodes.FORBIDDEN).json({ msg: "Unauthorized" });
    }

    const records = result.rows;
    const insights = getInsights(records);

    return res.json({
      ...insights,
      transactions: records,
    });

  } catch (err) {
    console.log(err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: "Error in recent activity" });
  }
});


router.get("/stats", verifyJWT, async (req, res) => {
  try {
    let result;


    if (req.role === "viewer") {
      result = await fetchAllForUser(req.client, req.userId);
    } else if (["analyst", "admin"].includes(req.role)) {
      result = await fetchAll(req.client);
    } else {
      return res.status(StatusCodes.FORBIDDEN).json({ msg: "Unauthorized" });
    }

    const records = result.rows;
    const insights = getInsights(records);

    return res.json(insights);

  } catch (err) {
    console.log(err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: "Error in stats API" });
  }
});


export default router;