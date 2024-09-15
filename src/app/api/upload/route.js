import { NextResponse } from 'next/server'
import { getFirestore, collection, getDocs, setDoc, doc, deleteDoc, updateDoc, addDoc } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL, uploadBytes } from 'firebase/storage';
import { app } from '../../firebaseConfig';

const storage = getStorage(app);

// upload image file(s) to firebase storage and return the download url(s)
export async function POST(req) {
    const { files } = await req.body();
    const urls = [];
    try {

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const storageRef = ref(storage, `images/${file.name}`);
            await uploadBytes(storageRef, file.buffer);
            const url = await getDownloadURL(storageRef);
            urls.push(url);
        }
        return NextResponse.json(urls, {
            status: 200,
        })
    } catch (error) {
        console.error('Error:', error)
        return new NextResponse(JSON.stringify({ error: { message: error.message } }), {
            status: 500,
        })
    }
}
