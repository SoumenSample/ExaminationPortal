import mongoose from "mongoose"

const ChatSchema = new mongoose.Schema({

email:{
type:String,
required:true
},

message:{
type:String,
required:true
},

studentEmail:{
type:String,
default:null
},

// Edit tracking
isEdited:{
type:Boolean,
default:false
},
editedAt:{
type:Date,
default:null
},
editedMessage:{
type:String,
default:null
},

// Delete tracking
deletedAt:{
type:Date,
default:null
},
deletedBy:{
type:String,
default:null
},

// Block functionality
isUserBlocked:{
type:Boolean,
default:false
},
blockedBy:{
type:String,
default:null
},
blockReason:{
type:String,
default:null
}

},{timestamps:true})

export default mongoose.models.Chat ||
mongoose.model("Chat",ChatSchema)