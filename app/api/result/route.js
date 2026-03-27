// import { connectDB } from "@/lib/db"
// import Result from "@/models/Result"

// export async function POST(req){

// try{

// await connectDB()

// const body = await req.json()

// const result = await Result.create(body)

// return Response.json({
// message:"Result saved",
// result
// })

// }catch(error){

// return Response.json({error:error.message},{status:500})

// }

// }

import { connectDB } from "@/lib/db"
import Result from "@/models/Result"

function normalizeEmail(value){
return typeof value === "string" ? value.trim().toLowerCase() : ""
}

function escapeRegex(value){
return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}


// SAVE RESULT
export async function POST(req){

try{

await connectDB()

const body = await req.json()

const normalizedEmail = normalizeEmail(body?.email)

if(!normalizedEmail){
return Response.json(
{message:"Email is required"},
{status:400}
)
}

const existingResult = await Result.findOne({ email:normalizedEmail }).select("_id")

if(existingResult){
return Response.json(
{message:"You can submit exam only once"},
{status:409}
)
}

const result = await Result.create({
...body,
email:normalizedEmail,
isPublished:false
})

return Response.json({
message:"Result saved",
result
})

}catch(error){

return Response.json(
{error:error.message},
{status:500}
)

}

}



 // GET RESULT BY EMAIL

export async function GET(req){

try{

await connectDB()

const { searchParams } = new URL(req.url)

const top = searchParams.get("top")

if(top === "1" || top === "true"){
const highest = await Result.findOne({})
.sort({score:-1,createdAt:-1})
.select("email score")

return Response.json(highest)
}

const email = searchParams.get("email")
const normalizedEmail = normalizeEmail(email)

if(!normalizedEmail){
return Response.json(
{message:"Email is required"},
{status:400}
)
}

const result = await Result.findOne({
email:{
$regex:`^${escapeRegex(normalizedEmail)}$`,
$options:"i"
}
}).sort({createdAt:-1})

return Response.json(result)

}catch(error){

return Response.json(
{error:error.message},
{status:500}
)

}

}




 // ADMIN PUBLISH RESULT

export async function PATCH(req){

try{

await connectDB()

const { email } = await req.json()

if(email){
const updated = await Result.findOneAndUpdate(
{ email },
{ isPublished:true },
{ new:true }
)

return Response.json({
message:"Result published",
updated
})
}

const updateResult = await Result.updateMany(
{},
{ isPublished:true }
)

return Response.json({
message:"All results published",
matchedCount:updateResult.matchedCount,
modifiedCount:updateResult.modifiedCount
})

}catch(error){

return Response.json(
{error:error.message},
{status:500}
)

}

}