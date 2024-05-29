// pages/api/upload.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import cloudinary from 'cloudinary';

// Configure Cloudinary with your account details
cloudinary.v2.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const config = {
    api: {
        bodyParser: false,
    },
};

// Define a public ID for the video and its transcript
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const data: any = await new Promise((resolve, reject) => {
        const form = new IncomingForm();

        form.parse(req, (err, fields, files) => {
            if (err) return reject(err);
            resolve({ fields, files });
        });
    });

    const file = data?.files?.inputFile[0].filepath;
    console.log(data.files.inputFile[0].filepath);

    // Specify the publicId and the subtitle overlay as "subtitles:public_id.transcript"
    const videoPublicId = "my-video";
    const transcriptPublicId = `${videoPublicId}.transcript`;
    // const subtitlesOverlay = `subtitles:${transcriptPublicId}`;
    const subtitlesOverlay = { resource_type: "subtitles", public_id: "my-video.transcript" }

    // Set the transformation options for the video, including the subtitle overlay
    const transformationOptions = [
        { overlay: subtitlesOverlay },
        { flags: "layer_apply" }
    ];

    // Upload the video and generate video URL in a chain
    await cloudinary.v2.uploader
        .upload(file, {
            public_id: videoPublicId,
            resource_type: 'video',
            raw_convert: 'google_speech',
        })
        .then((uploadResponse) => {
            // Generate the video URL based on the upload response
            const videoUrl = cloudinary.v2.url(videoPublicId, {
                resource_type: 'video',
                transformation: transformationOptions,
            });

            // Return both upload response and video URL (can be modified to return only videoUrl as JSON)
            return { uploadResponse, videoUrl };
        })
        .then((combinedData) => {
            // Handle the combined data (uploadResponse and videoUrl)
            console.log(combinedData); // Log for debugging purposes
            res.json(combinedData); // Return the combined data as JSON (modify object if needed)
        })
        .catch((error) => {
            console.error(error);
            res.status(500).json({ message: error.message }); // Handle errors
        });
};