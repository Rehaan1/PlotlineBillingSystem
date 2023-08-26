const gc = require('../../config')
const bucket = gc.bucket(process.env.BUCKET_NAME) // should be your bucket name

/**
 *
 * @param { File } object file object that will be uploaded
 * @description - This function does the following
 * - It uploads a file to the image bucket on Google Cloud
 * - It accepts an object as an argument with the
 *   "originalname" and "buffer" as keys
 */

const uploadImage = (filePath, fileName) => new Promise((resolve, reject) => {
    
    const bucketName = "plotline"
    
    bucket.upload(filePath,
        {
            destination: fileName,
        }, function(err,file){
            if(err)
            {
                console.error(`Error uploading image image_to_upload.jpeg: ${err}`)
                reject(`Unable to upload image, something went wrong`)
            }
            else
            {
                console.log(`Image image_to_upload.jpeg uploaded to ${bucketName}.`)

                resolve(file.publicUrl())
            }
        })
  })

module.exports = uploadImage