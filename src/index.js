import express from "express";
import cors from "cors";
import route from "./routes/routes.js";
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: "*",
}));
app.use("/api/v1/", route);

app.get("/",(req,res)=>{
    res.send("server is healthy ...");
})

const PORT = parseInt(process.env.PORT) || 2001;
app.listen(PORT,()=>{
console.log(`server listening on port ${PORT}`);    
});
