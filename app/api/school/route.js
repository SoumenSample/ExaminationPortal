import { connectDB } from "@/lib/db"
import School from "@/models/School"

export async function GET(req) {
  try {
    await connectDB()
    
    const count = await School.countDocuments({})
    const schools = await School.find({}).select("_id name city").limit(10)
    
    return Response.json({
      success: true,
      totalSchools: count,
      sampleSchools: schools
    })
  } catch (error) {
    console.error("Error fetching school info:", error)
    return Response.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(req) {
  try {
    await connectDB()
    
    const body = await req.json()
    
    const {
      name,
      address,
      city,
      state,
      pincode,
      phone,
      email,
      registrationNumber,
      principalName
    } = body
    
    // Validate required fields
    if (!name || !address || !city || !state || !pincode || !phone || !email || !registrationNumber) {
      return Response.json(
        { error: "All required fields must be provided" },
        { status: 400 }
      )
    }
    
    // Check if school already exists
    const existing = await School.findOne({ registrationNumber })
    if (existing) {
      return Response.json(
        { error: "School with this registration number already exists" },
        { status: 400 }
      )
    }
    
    // Create new school
    const school = await School.create({
      name,
      address,
      city,
      state,
      pincode,
      phone,
      email: email.toLowerCase(),
      registrationNumber,
      principalName: principalName || null,
      status: "active"
    })
    
    return Response.json({
      success: true,
      message: "School created successfully",
      school
    })
  } catch (error) {
    console.error("Error creating school:", error)
    return Response.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
