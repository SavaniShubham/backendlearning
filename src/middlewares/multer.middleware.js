import multer from "multer";




const storage = multer.diskStorage({
    destination: function (_, file, cb) {
      cb(null, "./public/temp")
      console.log("file geted!!" , file)
    },
    filename: function (_, file, cb) {
      
      cb(null, file.originalname)
      console.log("file name  geted!!" , file.originalname);
    }
  })
  
export const upload = multer({ 
    storage, 
})
