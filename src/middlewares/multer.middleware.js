import multer from "multer";




const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp")
      console.log("file geted!!" , file)
    },
    filename: function (req, file, cb) {
      
      cb(null, file.originalname)
      console.log("file name  geted!!" , file.originalname);
    }
  })
  
export const upload = multer({ 
    storage, 
})
