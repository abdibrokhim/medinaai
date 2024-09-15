'use client';

import Image from "next/image";
import {
  SignedIn,
  UserButton,
  useUser,
} from '@clerk/nextjs'
import React, { useCallback, useEffect, useState, useRef, memo } from 'react';
import { faAdd, faChevronDown, faClose, faFile, faChevronLeft, faChevronRight, faCompass, faShare, faPrint, faExpand, faTrash, faCircleCheck, faClone, faPenNib, faMinus, faCircleInfo, faEye, faBrain } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Patient, Observation, Hospital, PatientObservation, ObservationDefaultView, ShareReport, ReportProps } from './types';
import Notification from './notify';
import { getFirestore, collection, getDocs, getDoc, setDoc, doc, deleteDoc, updateDoc, addDoc } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL, uploadBytes } from 'firebase/storage';
import { app } from './firebaseConfig';
import { query, where } from 'firebase/firestore';

const storage = getStorage(app);
const firestore = getFirestore(app);

export default function Home() {
  const {isLoaded, isSignedIn, user} = useUser();
  const [showUploadImageView, setShowUploadImageView] = useState(false);
  const [showPortalView, setShowPortalView] = useState(false);
  const [showReportView, setShowReportView] = useState(false);
  const [isAddingScanAndPatient, setIsAddingScanAndPatient] = useState(false);
  const [isUploadingScans, setIsUploadingScans] = useState(false);
  const [patientData, setPatientData] = useState<Patient | null>(null);
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientBirthYear, setPatientBirthYear] = useState('');
  const [patientPhoneNumber, setPatientPhoneNumber] = useState('');
  const [scanUrls, setScanUrls] = useState([]);
  const [droppedFiles, setDroppedFiles] = useState<File[]>([]);
  const [conclusion, setConclusion] = useState('');
  const [notification, setNotification] = useState<{ message: string; type: 'error' | 'success' |'info' } | null>(null);  // notification message
  const [hospitalData, setHospitalData] = useState<Hospital | null>(null);
  const [hospitalId, setHospitalId] = useState('');
  const [allObservations, setAllObservations] = useState<PatientObservation[]>([]);
  const [showExpandedObservation, setShowExpandedObservation] = useState(false);
  const [showExpandedConclusion, setShowExpandedConclusion] = useState(false);
  const [isFetchingObservationById, setIsFetchingObservationById] = useState(false);
  const [defaultViewObservations, setDefaultViewObservations] = useState<ObservationDefaultView[]>([]);
  const [oneObservation, setOneObservation] = useState<PatientObservation | null>(null);
  const [isGeneratingConclusion, setIsGeneratingConclusion] = useState(false);
  const [radiologistName, setRadiologistName] = useState('');
  const [isRegeneratingConclusion, setIsRegeneratingConclusion] = useState(false);
  const [isDeletingObservation, setIsDeletingObservation] = useState(false);
  const [isSavingObservation, setIsSavingObservation] = useState(false);
  const [isSegmentingScans, setIsSegmentingScans] = useState(false);
  const [isApprovingObservation, setIsApprovingObservation] = useState(false);
  const [savingPatientDetails, setSavingPatientDetails] = useState(false);
  const [refetch, setRefetch] = useState(false);
  const [segmentResult, setSegmentResult] = useState<any>(null);
  const [refetchHospitalDetails, setRefetchHospitalDetails] = useState(false);
  const [refetchOneObservation, setRefetchOneObservation] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [isUploadingReport, setIsUploadingReport] = useState(false);
  const [isUpdatingReportUrl, setIsUpdatingReportUrl] = useState(false);
  const [reportViewData, setReportViewData] = useState<ShareReport[]>([]);
  const [isFetchingReports, setIsFetchingReports] = useState(false);
  const [headDoctorName, setHeadDoctorName] = useState('');
  const [showHospitalDetailsView, setShowHospitalDetailsView] = useState(false);
  const [isSavingHospitalDetails, setIsSavingHospitalDetails] = useState(false);
  const [hFullName, setHFullName] = useState('');
  const [hDepartment, setHDepartment] = useState('');
  const [hAddress, setHAddress] = useState('');
  const [hPhone, setHPhone] = useState('');
  const [showExpandedReportView, setShowExpandedReportView] = useState(false);

  // for testing purposes
  const sampleData = [
    "https://firebasestorage.googleapis.com/v0/b/comed-27032024.appspot.com/o/images%2FY12.jpg?alt=media&token=5e53394c-f012-4aee-901c-c028f1c2e570",
    "https://firebasestorage.googleapis.com/v0/b/comed-27032024.appspot.com/o/images%2FY14.jpg?alt=media&token=e06f7c52-9f1c-4999-9d9c-33f9b956e08d",
    "https://firebasestorage.googleapis.com/v0/b/comed-27032024.appspot.com/o/images%2FY187.jpg?alt=media&token=36c88074-8cec-4640-8813-ca74bddeb588",
    "https://firebasestorage.googleapis.com/v0/b/comed-27032024.appspot.com/o/images%2FY34.jpg?alt=media&token=6b51ed32-bfaf-43b5-ac95-5236d3466ce1",
  ]

  // refs
  const expandRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // Create a ref for the file input

  // on first sign up we will save the hospital details to firestore
  useEffect(() => {
    if (isSignedIn && user) {
      const hId = user.id;
      console.log('hId: ', hId);
      setHospitalId(hId);

      // check whether the all fields in hospital details are filled or not fetch the hospital details from firestore
      // if not call setHospitalDetailsView to true and show the hospital details view
      // on submit register the hospital to firestore
      // otherwise fetch the hospital details from firestore

      const initializeData = async () => {
        try {
          // Save hospital details
          // await registerHospital(hId);
          // Fetch hospital details
          const hD = await fetchHospitalDetails(hId);
          console.log('initializeData() hospital data: ', hD);
        } catch (error) {
          console.error('Error during initialization:', error);
        }
      };

      const runChecking = async () => {
        console.log('checking hospital details...'); 
        try {
          const hD = await fetchHospitalDetails(hId);
          console.log('fetchHosDet() hospital data: ', hD);

          if (hD !== null || hD !== undefined) {
            console.log('f.name: ', hD!.name);
            if (hD!.name !== '' && hD!.department !== '' && hD!.address !== '' && hD!.phone !== '') {
              console.log('hospital details already filled');
              setShowHospitalDetailsView(false);
            } else {
              console.log('hospital details not filled');
              setShowHospitalDetailsView(true);
              // pre fill some fields
              if (hD?.name !== '') {
                setHFullName(hD!.name);
              }
              if (hD?.department !== '') {
                setHDepartment(hD!.department);
              }
              if (hD?.address !== '') {
                setHAddress(hD!.address);
              }
              if (hD?.phone !== '') {
                setHPhone(hD!.phone);
              }
            }
          }
          return hD;
        } catch (error) {
          console.error('Error fetching hospital details:', error);
          return null;
        }
      };

      runChecking();
      initializeData();
      fetchDefaultViewObservations();
    }
  }, [isSignedIn, user]);

  // register hospital to firestore
  const registerHospital = async (hId: any) => {
    console.log('registering hospital...');
    console.log('hospital id: ', hId);
    try {
      if (!hId) {
        triggerNotification('Invalid hospital ID', 'error');
        return;
      }
  
      const hospitalRef = doc(firestore, 'hospitals', hId); // Reference to the hospital document
      const hospitalSnapshot = await getDoc(hospitalRef); // Check if the hospital already exists
  
      if (!hospitalSnapshot.exists()) {
        // Hospital does not exist, create a new document
        await setDoc(hospitalRef, {
          name: hFullName,
          department: hDepartment,
          address: hAddress,
          phone: hPhone,
          email: user?.emailAddresses[0].emailAddress,
        });
        console.log('Hospital registered with ID:', hId);
        triggerNotification('Hospital registered successfully', 'success');
      } else {
        // Hospital already exists, update the fields
        await updateDoc(hospitalRef, {
          name: hFullName,
          department: hDepartment,
          address: hAddress,
          phone: hPhone,
          email: user?.emailAddresses[0].emailAddress,
        });
        console.log('Hospital updated with ID:', hId);
        triggerNotification('Hospital updated successfully', 'success');
      }
    } catch (error) {
      console.error('Error registering hospital:', error);
      triggerNotification('An error occurred while registering hospital', 'error');
    } finally {
      // setRefetchHospitalDetails(true); // Trigger a refetch of hospital details after registration attempt
    }
  };

  // Close the expanded image if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: any) => {
        if (expandRef.current && !expandRef.current.contains(event.target)) {
          setShowExpandedObservation(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

      // show notification
      const triggerNotification = (nMessage: string, nType: 'error' | 'success' | 'info') => {
        setNotification({ message: nMessage, type: nType });
    };

  const loader = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
      <circle cx={4} cy={12} r={3} fill="currentColor">
        <animate id="svgSpinners3DotsScale0" attributeName="r" begin="0;svgSpinners3DotsScale1.end-0.25s" dur="0.75s" values="3;.2;3" />
      </circle>
      <circle cx={12} cy={12} r={3} fill="currentColor">
        <animate attributeName="r" begin="svgSpinners3DotsScale0.end-0.6s" dur="0.75s" values="3;.2;3" />
      </circle>
      <circle cx={20} cy={12} r={3} fill="currentColor">
        <animate id="svgSpinners3DotsScale1" attributeName="r" begin="svgSpinners3DotsScale0.end-0.45s" dur="0.75s" values="3;.2;3" />
      </circle>
    </svg>
  );

  const handleShowUploadImageView = () => {
    setShowUploadImageView(true);
    // setShowPortalView(false);
    // setShowReportView(false);
  }

  const handleShowPortalView = () => {
    fetchDefaultViewObservations();
    setShowUploadImageView(false);
    setShowPortalView(true);
    setShowReportView(false);
  }

  const handleShowReportView = () => {
    setShowUploadImageView(false);
    setShowPortalView(false);
    setShowReportView(true);
    fetchReports();
  }

  const fetchReports = async () => {
    setIsFetchingReports(true);
    console.log('fetching reports...');
    try {
      const reportsRef = collection(firestore, 'hospitals', hospitalId, 'reports');
      const reportsSnapshot = await getDocs(reportsRef);
      const reportsData: ShareReport[] = [];
  
      for (const doc of reportsSnapshot.docs) {
        const reportData = doc.data() as ShareReport;
        reportsData.push(reportData);
      }
      setReportViewData(reportsData);
    } catch (error) {
      console.error('Error fetching reports:', error);
      triggerNotification('An error occurred while fetching reports', 'error');
    } finally {
      setIsFetchingReports(false);
    }
  };

  const proceedWithScans = async () => {
    console.log('proceeding with scans...');
    setShowUploadImageView(false);
    setShowExpandedConclusion(true);
    const infos = await handleSegmentScans();
    const prcd = await uploadScansToFirebaseStorage();
    if (prcd) {
      if (scanUrls.length === 0) {
        triggerNotification('Something went wrong on setScanUrls state', 'error');
        setIsSavingObservation(false);
        // return
      }
      console.log("segmented scans: ", infos);
      if (infos) {
        const a = handleGenerateConclusion(infos);
        console.log('generated conclusion: ', a);
      }
    }
    console.log('done');
  }

  // generate conclusion
  const handleGenerateConclusion = async (segmentedData: any) => {
    setIsGeneratingConclusion(true);
    triggerNotification('Generating conclusion...', 'info');
    console.log("---------------------");
    console.log(segmentedData);
    console.log("---------------------");
    try {
      const result = await fetch('/api/generate', {
        method: 'POST',
        headers: { origin: 'http://localhost:3000' },
        body: JSON.stringify({prompt: segmentedData}),
      })
      const resultJson = await result.json()
      
      const {error} = resultJson
      
      if (error) {
        console.warn(error.message)
        triggerNotification(error.message, 'error')
      } else {
        const stringResponse = JSON.stringify(resultJson);
        console.log(stringResponse)
        setConclusion(stringResponse.replace(/"/g, '').replace(/\n/g, ' '));
        triggerNotification('Conclusion generated successfully', 'success')
        return stringResponse;
      }
    } catch (error) {
      console.error(error)
      triggerNotification('An error occurred', 'error')
      return false;
    } finally {
      setIsGeneratingConclusion(false)
    }
  };

  const testaiml = async () => {
    const data = {
      "segmentation_masks": {
        "ventricles": "binary_mask_ventricles.png",
        "cortex": "binary_mask_cortex.png",
        "lesions": "binary_mask_lesions.png"
      },
      "volume_measurements": {
        "left_lateral_ventricle_volume": 5000, 
        "right_lateral_ventricle_volume": 5200, 
        "third_ventricle_width": 3.0,
        "fourth_ventricle_width": 4.0 
      },
      "intensity_statistics": {
        "white_matter_isointense": true,
        "grey_matter_intensity_mean": 80,
        "grey_matter_intensity_variance": 5
      },
      "abnormalities": {
        "lesions": [
          {
            "type": "hyperintense",
            "location": "periventricular",
            "size": {
              "width": 5.0,
              "height": 5.0,
              "depth": 3.0 
            }
          }
        ],
        "atrophy": {
          "cerebellum": false,
          "frontal_lobe": true
        },
        "sinus_anomalies": [
          {
            "type": "mucosal_thickening",
            "location": "maxillary_sinus",
            "severity": "moderate"
          }
        ]
      },
      "roi_descriptions": [
        "Left lateral ventricle volume is within normal range.",
        "Right lateral ventricle slightly larger than the left.",
        "No abnormal signal intensities in the basal ganglia.",
        "Cerebellum appears normal."
      ]
    };
    const r = handleGenerateConclusion(data);
    console.log('ai ml response: ', r);
  };

  // segment brain mri scans
  const handleSegmentScans = async () => {
    setIsSegmentingScans(true);
    triggerNotification('Segmenting scans...', 'info');
    try {
      const result = await fetch('/api/segment', {
        method: 'POST',
        headers: { origin: 'http://localhost:3000' },
        body: JSON.stringify({ scanUrls }),
      })
      const resultJson = await result.json()
      
      const {error} = resultJson
      
      if (error) {
        console.warn(error.message)
        triggerNotification(error.message, 'error')
      } else {
        console.log(resultJson)
        triggerNotification('Scans segmented successfully', 'success')
        setSegmentResult(resultJson)
        return resultJson
      }
    } catch (error) {
      console.error(error)
      triggerNotification('An error occurred', 'error')
    } finally {
      setIsSegmentingScans(false)
    }
  };

  // for testing purpose
  const test = async () => {
    console.log('testing...');
    const s = await handleSegmentScans();
    console.log('s: ', s);
    if (s) {
      const a = await handleGenerateConclusion(s);
      console.log('a: ', a);
    }
    console.log('done');
  };
  
  // upload image file(s) to firebase storage and return the download url(s)
  const uploadScansToFirebaseStorage = async () => {
    setIsUploadingScans(true);
    triggerNotification('Uploading scans...', 'info');
    try {
      const uploadPromises = droppedFiles.map(async (file: File) => {
        const storageRef = ref(storage, `images/${file.name}`);
        await uploadBytes(storageRef, file); // Directly use 'file' without '.buffer'
        const url = await getDownloadURL(storageRef);
        return url;
      });

      const urls: any = await Promise.all(uploadPromises); // Wait for all uploads to complete
      setScanUrls(urls); // Update the scan URLs state once all are uploaded
      triggerNotification('Scans uploaded successfully', 'success');
      return true;
    } catch (error) {
      console.error('Error uploading files:', error); // Log the actual error for debugging
      triggerNotification('An error occurred during upload', 'error');
      return false;
    } finally {
      setIsUploadingScans(false);
    }
  };

  // export interface Observation {
  //     id: number;
  //     patientId: string;
  //     imageUrls: [string];
  //     conclusionText: string;
  //     radiologistName: string;
  //     headDoctorName: string;
  //     reportUrl: string;
  //     status: string;
  //     updatedAt: Timestamp;
  //     createdAt: Timestamp;
  // }
  // save observation to firestore
  const saveObservation = async (pId: string) => {
    setIsSavingObservation(true);
    triggerNotification('Saving observation...', 'info');
    try {
      const observationRef = await addDoc(collection(firestore, 'hospitals', hospitalId, 'observations'), {
        patientId: pId,
        imageUrls: scanUrls,
        conclusionText: conclusion,
        radiologistName: radiologistName,
        headDoctorName: "",
        reportUrl: '',
        status: 'pending',
        updatedAt: new Date(),
        createdAt: new Date(),
      });
      console.log('Observation saved with ID:', observationRef.id);
      triggerNotification('Observation saved successfully', 'success');
      return observationRef.id;
    } catch (error) {
      console.error('Error saving observation:', error);
      triggerNotification('An error occurred while saving observation', 'error');
      return false;
    } finally {
      setIsSavingObservation(false);
    }
  };
//   export interface PatientObservation {
//     id: string;
//     patientId: string;
//     patientDetails: Patient;
//     imageUrls: [string];
//     conclusionText: string;
//     radiologistName: string;
//     headDoctorName: string;
//     reportUrl: string;
//     status: string;
//     updatedAt: Timestamp;
//     createdAt: Timestamp;
// }
  // fetch all observations, use PatientObservation type
  const fetchAllObservations = async () => {
    try {
      const observationsRef = collection(firestore, 'hospitals', hospitalId, 'observations');
      const observationsSnapshot = await getDocs(observationsRef);
      const observationsData: PatientObservation[] = [];
  
      for (const doc of observationsSnapshot.docs) {
        const observationData = doc.data() as Observation;
  
        // Fetch patient details using await to ensure we get the actual patient data
        const patientDetails = await fetchPatientDetails(observationData.patientId);
  
        if (!patientDetails) {
          console.warn(`No patient details found for patient ID: ${observationData.patientId}`);
          triggerNotification(`No patient data found for patient ID: ${observationData.patientId}`, 'error');
          continue; // Skip this iteration if patient details are not found
        }
  
        const observation: PatientObservation = {
          id: doc.id,
          patientId: observationData.patientId,
          patientDetails: patientDetails,
          hospitalDetails: hospitalData!,
          imageUrls: observationData.imageUrls,
          conclusionText: observationData.conclusionText,
          radiologistName: observationData.radiologistName,
          headDoctorName: observationData.headDoctorName,
          reportUrl: observationData.reportUrl,
          status: observationData.status,
          updatedAt: observationData.updatedAt,
          createdAt: observationData.createdAt,
        };
        observationsData.push(observation);
      }
  
      setAllObservations(observationsData);
    } catch (error) {
      console.error('Error fetching observations:', error);
      triggerNotification('An error occurred while fetching observations', 'error');
    }
  };

  // fetch observation by id
  const fetchObservationById = async (observationId: string) => {
    setIsFetchingObservationById(true);
    triggerNotification('Fetching observation...', 'info');
  
    try {
      const observationRef = doc(firestore, 'hospitals', hospitalId, 'observations', observationId);
      const observationSnapshot = await getDoc(observationRef);
  
      if (!observationSnapshot.exists()) {
        console.warn(`No observation found for ID: ${observationId}`);
        triggerNotification(`No observation found for ID: ${observationId}`, 'error');
        return;
      }
  
      const data = observationSnapshot.data();
      
      if (!data) {
        console.warn('Data is undefined or null');
        triggerNotification('Failed to fetch observation data', 'error');
        return;
      }
  
      const observationData: Observation = {
        id: observationSnapshot.id,
        patientId: data.patientId || '',  // Ensure required fields are handled
        imageUrls: data.imageUrls || [],
        conclusionText: data.conclusionText || '',
        radiologistName: data.radiologistName || '',
        headDoctorName: data.headDoctorName || '',
        reportUrl: data.reportUrl || '',
        status: data.status || '',
        updatedAt: data.updatedAt,
        createdAt: data.createdAt,
      };
  
      // Fetch patient details using await to ensure we get the actual patient data
      const patientDetails = await fetchPatientDetails(observationData.patientId);
  
      if (!patientDetails) {
        console.warn(`No patient details found for patient ID: ${observationData.patientId}`);
        triggerNotification(`No patient data found for patient ID: ${observationData.patientId}`, 'error');
        return;
      }
  
      const observation: PatientObservation = {
        id: observationSnapshot.id,
        patientId: observationData.patientId,
        patientDetails: patientDetails,
        hospitalDetails: hospitalData!,
        imageUrls: observationData.imageUrls,
        conclusionText: observationData.conclusionText,
        radiologistName: observationData.radiologistName,
        headDoctorName: observationData.headDoctorName,
        reportUrl: observationData.reportUrl,
        status: observationData.status,
        updatedAt: observationData.updatedAt,
        createdAt: observationData.createdAt,
      };
  
      setOneObservation(observation); // Replace this with your state setter or handling logic
      triggerNotification('Observation fetched successfully', 'success');
    } catch (error) {
      console.error('Error fetching observation:', error);
      triggerNotification('An error occurred while fetching observation', 'error');
    } finally {
      setIsFetchingObservationById(false);
    }
  };
  
  // fetch observation by id for report view with extra data
  const fetchObservationByIdForReportView = async (observationId: string) => {
    console.log('fetchObservationByIdForReportView() observationId: ', observationId);
    setIsFetchingObservationById(true);
    triggerNotification('Fetching observation...', 'info');
  
    try {
      const observationRef = doc(firestore, 'hospitals', hospitalId, 'observations', observationId);
      const observationSnapshot = await getDoc(observationRef);
  
      if (!observationSnapshot.exists()) {
        console.warn(`No observation found for ID: ${observationId}`);
        triggerNotification(`No observation found for ID: ${observationId}`, 'error');
        return;
      }
  
      const data = observationSnapshot.data();
      
      if (!data) {
        console.warn('Data is undefined or null');
        triggerNotification('Failed to fetch observation data', 'error');
        return;
      }
  
      const observationData: Observation = {
        id: observationSnapshot.id,
        patientId: data.patientId || '',
        imageUrls: data.imageUrls || [],
        conclusionText: data.conclusionText || '',
        radiologistName: data.radiologistName || '',
        headDoctorName: data.headDoctorName || '',
        reportUrl: data.reportUrl || '',
        status: data.status || '',
        updatedAt: data.updatedAt,
        createdAt: data.createdAt,
      };
  
      // Fetch patient details using await to ensure we get the actual patient data
      const patientDetails = await fetchPatientDetails(observationData.patientId);
  
      if (!patientDetails) {
        console.warn(`No patient details found for patient ID: ${observationData.patientId}`);
        triggerNotification(`No patient data found for patient ID: ${observationData.patientId}`, 'error');
        return;
      }
  
      const observation: PatientObservation = {
        id: observationSnapshot.id,
        patientId: observationData.patientId,
        patientDetails: patientDetails,
        hospitalDetails: hospitalData!,
        imageUrls: observationData.imageUrls,
        conclusionText: observationData.conclusionText,
        radiologistName: observationData.radiologistName,
        headDoctorName: observationData.headDoctorName,
        reportUrl: observationData.reportUrl,
        status: observationData.status,
        updatedAt: observationData.updatedAt,
        createdAt: observationData.createdAt,
      };
  
      setOneObservation(observation); // Replace this with your state setter or handling logic
      triggerNotification('Observation fetched successfully', 'success');
  
    } catch (error) {
      console.error('Error fetching observation:', error);
      triggerNotification('An error occurred while fetching observation', 'error');
    } finally {
      setIsFetchingObservationById(false);
    }
  };

  // fetch all observations only one image url
  const fetchDefaultViewObservations = async () => {
    console.log('fetching default view observations...');
    console.log('hospital id: ', hospitalId);
    
    try {
      const observationsRef = collection(firestore, 'hospitals', hospitalId, 'observations');
      const observationsQuery = query(observationsRef, where('status', '!=', 'approved'));
      const observationsSnapshot = await getDocs(observationsQuery);
      const observationsData: ObservationDefaultView[] = [];
  
      observationsSnapshot.forEach((docSnapshot) => {
        const observationData = docSnapshot.data() as Observation;
        
        // Manually add the document ID from Firestore snapshot
        const observation: ObservationDefaultView = {
          id: docSnapshot.id,  // Use docSnapshot.id to get the document ID
          imageUrl: observationData.imageUrls ? observationData.imageUrls[0] : '', // Safely handle potential undefined
          updatedAt: observationData.updatedAt,
          createdAt: observationData.createdAt,
        };
  
        console.log('--- observation.id: ', observation.id);  // Correctly log the ID
  
        observationsData.push(observation);
      });
  
      setDefaultViewObservations(observationsData);
    } catch (error) {
      console.error('Error fetching observations:', error);
      triggerNotification('An error occurred while fetching observations', 'error');
    }
  };

  useEffect(() => {
    // fetchAllObservations();
    fetchDefaultViewObservations();
  }, [refetch]); // Make sure to include hospitalId in the dependency array

  // export interface Patient {
  //     id: string;
  //     name: string;
  //     birthYear: string;
  //     phoneNumber: string;
  // }
  // save user details to firestore under hospital collection with hospital id. patient id should be generated document id keep phone number empty if not provided
  const savePatientDetails = async () => {
    setSavingPatientDetails(true);
    try {
      const patientRef = await addDoc(collection(firestore, 'hospitals', hospitalId, 'patients'), {
        name: patientName,
        birthYear: patientBirthYear,
        phoneNumber: patientPhoneNumber,
      });
      setPatientId(patientRef.id);
      console.log('Patient details saved with ID:', patientRef.id);
      triggerNotification('Patient details saved successfully', 'success');
      return patientRef.id;
    } catch (error) {
      console.error('Error saving patient details:', error);
      triggerNotification('An error occurred while saving patient details', 'error');
    } finally {
      setSavingPatientDetails(false);
    }
  };

  // get patient details by patient id
  const fetchPatientDetails = async (patientId: string) => {
    try {
      const patientRef = doc(firestore, 'hospitals', hospitalId, 'patients', patientId);
      const patientSnapshot = await getDoc(patientRef);
  
      if (patientSnapshot.exists()) {
        const data = patientSnapshot.data() as Patient;
        return data;
      } else {
        console.warn('No such document!');
        triggerNotification('No patient data found for the provided ID', 'error');
      }
    } catch (error) {
      console.error('Error fetching patient details:', error);
      triggerNotification('An error occurred while fetching patient details', 'error');
    }
    return undefined; // Explicitly return undefined in case of failure or non-existent document
  };

  // export interface Hospital {
  //     id: string;
  //     name: string;
  //     department: string;
  //     address: string;
  //     phone: string;
  //     email: string;
  // }
  // useEffect and fetch hospital details by hospital id
  const fetchHospitalDetails = async (hId: any) => {
    console.log('fetching hospital details...');
    console.log('hospital id: ', hId);

    try {
      if (!hId) {
        console.error('Invalid hospital ID');
        triggerNotification('Invalid hospital ID. Cannot fetch hospital details.', 'error');
        return;
      }

      const hospitalRef = doc(firestore, 'hospitals', hId); // Reference to the specific document
      const hospitalSnapshot = await getDoc(hospitalRef); // Fetch the document snapshot

      if (hospitalSnapshot.exists()) { // Check if the document exists
        const data = hospitalSnapshot.data() as any;
        const hospitalData: Hospital = {
          id: hId,
          name: data.name,
          department: data.department,
          address: data.address,
          phone: data.phone,
          email: data.email,
        };

        setHospitalData(hospitalData);
        return hospitalData;
      } else {
        console.warn('No such document!');
        triggerNotification('No hospital data found for the provided ID', 'error');
      }
    } catch (error) {
      console.error('Error fetching hospital details:', error);
      triggerNotification('An error occurred while fetching hospital details', 'error');
    } finally {
      // Any final steps
    }
  };

  useEffect(() => {
    fetchHospitalDetails(hospitalId);
  }, [refetchHospitalDetails, hospitalId]); // Make sure to include hospitalId in the dependency array

  // share report
  const shareReport = () => {
    console.log('share report');
  };
  
  // Slider
  // Memoized ImageSlider component
  const ImageSlider = memo(({ images }: { images: string[] }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    
    console.log('images: ', typeof images);

    // Convert to array and flatten if necessary
    let imagesArray = Object.values(images).flat(); // Flatten the array if there are nested arrays
    console.log('typeof imagesArray: ', typeof imagesArray);
    console.log('imagesArray: ', imagesArray);

    // Function to go to the previous image
    const prevImage = useCallback(() => {
      console.log('previous image');
      setCurrentIndex((prevIndex) => (prevIndex === 0 ? images.length - 1 : prevIndex - 1));
    }, [images]);

    // Function to go to the next image
    const nextImage = useCallback(() => {
      console.log('next image');
      setCurrentIndex((prevIndex) => (prevIndex === images.length - 1 ? 0 : prevIndex + 1));
    }, [images]);

    console.log('images: ', images);

    return (
      <div className="relative w-full flex items-center justify-center">
        {/* Left Arrow */}
        <button
          onClick={prevImage}
          className="hover:bg-[#151515] p-2 absolute left-0 ml-4 flex items-center justify-center w-8 h-8 rounded-full text-white cursor-pointer shadow"
        >
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>

        {/* Image */}
        <div className="flex items-center justify-center w-full">
          {images[currentIndex] !== null || !isFetchingObservationById ? (
            <Image
            priority={true}
            src={images[currentIndex]}
              alt={`Observation Image ${currentIndex + 1}`}
              width={500}  // Adjust the width as needed
              height={300} // Adjust the height as needed
              className="rounded"
            />
          ) : (
              <span className='flex justify-center items-center text-white'>{loader()}</span>
          )}
        </div>

        {/* Right Arrow */}
        <button
          onClick={nextImage}
          className="hover:bg-[#151515] p-2 absolute right-0 mr-4 flex items-center justify-center w-8 h-8 rounded-full text-white cursor-pointer shadow"
        >
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>
    );
  });


  const ReportViewerPDF = memo(({ reportPdf }: { reportPdf: string }) => {
    
    console.log('reportPdf: ', reportPdf);

    return (
      <div className="relative w-full flex items-center justify-center">
        <div className="flex items-center justify-center w-full">
          {reportPdf !== null || !isFetchingObservationById ? (
            <iframe
            src={reportPdf}
            width="100%"
            height="500px" 
            className="rounded border"
            title="PDF Report Viewer"
          />
          ) : (
              <span className='flex justify-center items-center text-white'>{loader()}</span>
          )}
        </div>
      </div>
    );
  });

  // in default view we will show all observations
  const DefaultView = () => {
    return (
      <div className="flex flex-col items-center justify-center block">
        <div className="flex flex-row flex-wrap gap-8 items-center justify-center">
            {defaultViewObservations.map((obs, index) => (
              <div key={obs.id+'_'+index} className="flex flex-col justify-between gap-2">
                {/* show frist image */}
                <div className="flex items-center justify-center p-2 border border-[#a1a1aa] rounded-md">
                <BlurImage>
                  <Image
                    priority={true}
                    src={obs.imageUrl}
                    alt={`Observation Image ${index + 1}`}
                    width={300}  // Adjust the width as needed
                    height={300} // Adjust the height as needed
                    className="rounded"
                  />
                </BlurImage>
                </div>
              <button 
                disabled={isFetchingObservationById}
                onClick={() => {
                  // setExpandObservationIndex(obs.id);
                  console.log('fetching observation by id: ', obs.id);
                  fetchObservationById(obs.id);
                  setShowExpandedObservation(true);
                }} 
                className={`bg-[#0c4a6e] text-black p-2 rounded-md w-full font-bold hover:bg-[#0369a1]`}>
                {!isFetchingObservationById 
                  ? <span className='flex justify-center items-center text-white'><FontAwesomeIcon icon={faExpand} className="mr-2" />Expand</span>
                  : <span className='flex justify-center items-center text-white'>{loader()}</span>
                }
              </button>
            </div>
            ))}
        </div>
    </div>
    );
  };


  // Memoized functions to handle input changes
  const handleHeadDoctorNameChange = useCallback((e: any) => {
    setHeadDoctorName(e.target.value);
  }, []);
  
  // show expanded observation
  const ExpandedObservationView = () => {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-40">
      <div className="w-[90%] bg-[#2e2e2e] rounded-md">
        {/* header */}
        <div className="flex flex-row justify-between border-b border-[#a1a1aa] p-4">
          <p className="text-md">Observation details</p>
          <button
            onClick={() => setShowExpandedObservation(!showExpandedObservation)}
            className={`flex items-center justify-center w-[24px] h-[24px] rounded-full shadow cursor-pointer hover:bg-[#151515] p-2`}>
              {isApprovingObservation || isDeletingObservation || isUpdatingReportUrl || isUploadingReport || generatingReport || isFetchingObservationById
                ? <span className='flex justify-center items-center text-black'>{loader()}</span>
                : <FontAwesomeIcon icon={faClose} />
              }
          </button>
        </div>
        <div className="flex flex-row p-4 gap-4 items-center justify-between">
          {/* show images as slider*/}
          <div className="w-1/2">
            <ImageSlider images={oneObservation?.imageUrls!} />
          </div>
          <div className="w-1/2">
            {/* show conclusion */}
            <div className="">
                <p className="text-md">Conclusion</p>
                {!isFetchingObservationById
                    ? 
                <textarea
                  disabled={true}
                  value={oneObservation?.conclusionText || ''}
                  autoComplete="off"
                  id="conclusion1"
                  className="mt-2 placeholder:text-[#aaaaaa] placeholder:text-sm w-full px-4 py-3 text-white bg-transparent rounded border border-[#a1a1aa] focus:outline-none focus:border-white resize-none"
                  rows={4} // Specify the number of rows (height) of the textarea
                />
                : <span className='flex justify-center items-center text-white mt-2'>{loader()}</span>}
            </div>
            {/* show observation details */}
            <div className="mt-[40px] flex flex-col gap-6 justify-between items-start">
              <div className="w-full">
                <p className="text-md">Quick info</p>
                <div className="mt-2 flex flex-row gap-2 items-center justify-center">
                  <div className="flex flex-col gap-1 items-start justify-start w-1/2">
                    <p className="text-xs text-[#a1a1aa] block font-bold">Radiologist</p>
                    {!isFetchingObservationById
                    ? 
                    <input
                      disabled={true}
                      value={oneObservation?.radiologistName || ''}
                      autoComplete="off"
                        type="text"
                        id="radiologistName1"
                        placeholder="Enter radiologist name"
                        className="w-2/3 mt-2 placeholder:text-[#aaaaaa] placeholder:text-sm w-full px-4 py-3 text-white text-sm bg-transparent rounded border border-[#a1a1aa] focus:outline-none focus:border-white"
                      />
                      : <span className='flex justify-center items-center text-white mt-2'>{loader()}</span>}
                  </div>
                  <div className="flex flex-col gap-1 items-start justify-start w-1/2">
                    <p className="text-xs text-[#a1a1aa] block font-bold">Head Doctor:</p>
                    {!isFetchingObservationById
                    ? 
                    <input
                      value={oneObservation?.headDoctorName || headDoctorName}
                      onChange={handleHeadDoctorNameChange}
                      autoComplete="off"
                        type="text"
                        id="headDoctorName1"
                        placeholder="Enter head doctor name"
                        className="w-2/3 mt-2 placeholder:text-[#aaaaaa] placeholder:text-sm w-full px-4 py-3 text-white text-sm bg-transparent rounded border border-[#a1a1aa] focus:outline-none focus:border-white"
                      />
                      : <span className='flex justify-center items-center text-white mt-2'>{loader()}</span>}
                    </div>
                </div>
              </div>
              {/* show user details */}
              <div className="w-full">
                <p className="text-md">Patient info</p>
                <div className="mt-2 w-full flex flex-row gap-2 items-center justify-center">
                <div className="flex flex-col gap-1 items-start justify-start w-3/6">
                  <p className="text-xs text-[#a1a1aa] block font-bold">Full Name:</p>
                  {!isFetchingObservationById
                    ? 
                    <input
                        disabled={true}
                        value={oneObservation?.patientDetails.name || ''}
                        autoComplete="off"
                          type="text"
                          id="fullName1"
                          placeholder="Enter your Patient ID"
                          className="w-2/3 mt-2 placeholder:text-[#aaaaaa] placeholder:text-sm w-full px-4 py-3 text-sm text-white bg-transparent rounded border border-[#a1a1aa] focus:outline-none focus:border-white"
                        />
                  : <span className='flex justify-center items-center text-white mt-2'>{loader()}</span>
                }
                  </div>
                  <div className="flex flex-col gap-1 items-start justify-start w-1/6">
                  <p className="text-xs text-[#a1a1aa] block font-bold">Birth Year:</p>
                  {!isFetchingObservationById
                    ? 
                  <input
                    disabled={true}
                    value={oneObservation?.patientDetails.birthYear || ''}
                    autoComplete="off"
                      type="text"
                      id="birthYear1"
                      placeholder="Enter your Patient ID"
                      className="w-2/3 mt-2 placeholder:text-[#aaaaaa] placeholder:text-sm w-full px-4 py-3 text-sm text-white bg-transparent rounded border border-[#a1a1aa] focus:outline-none focus:border-white"
                    />
                  : <span className='flex justify-center items-center text-white mt-2'>{loader()}</span>
                }
                  </div>
                  <div className="flex flex-col gap-1 items-start justify-start w-2/6">
                  <p className="text-xs text-[#a1a1aa] block font-bold">Phone Number:</p>
                  {!isFetchingObservationById
                    ? 
                  <input
                  disabled={true}
                  value={oneObservation?.patientDetails.phoneNumber || ''}
                  autoComplete="off"
                  type="text"
                  id="phoneNumber1"
                  placeholder="Enter your Patient ID"
                  className="w-2/3 mt-2 placeholder:text-[#aaaaaa] placeholder:text-sm w-full px-4 py-3 text-sm text-white bg-transparent rounded border border-[#a1a1aa] focus:outline-none focus:border-white"
                  />
                  : <span className='flex justify-center items-center text-white mt-2'>{loader()}</span>
                }
                    </div>
                </div>
              </div>
            </div>
            {/* show action buttons */}
            <div className="flex flex-row gap-4 mt-[60px]"> 
              <button 
                    disabled={isApprovingObservation || isDeletingObservation || isUpdatingReportUrl || isUploadingReport || generatingReport || isFetchingObservationById}
                  onClick={() => {
                    handleDeleteObservation();
                  }} 
                  className={`bg-[#7f1d1d] text-black p-2 rounded-md w-full font-bold hover:bg-[#b91c1c]`}>
                  {!isApprovingObservation || !isDeletingObservation || !isUpdatingReportUrl || !isUploadingReport || !generatingReport || !isFetchingObservationById
                    ? <span className='flex justify-center items-center text-white'>Delete</span>
                    : <span className='flex justify-center items-center text-white'>{loader()}</span>
                  }
                </button>
              <button 
                    disabled={isApprovingObservation || isDeletingObservation || oneObservation?.status === "approved" || isUpdatingReportUrl || isUploadingReport || generatingReport || isFetchingObservationById}
                  onClick={ async () => {
                    // await handleGenerateReport();

                    if (await handleApproveObservation()) {
                      const url = await handleGenerateReport();
                      if (url) {
                        updateObservationReportUrl(url);
                      }
                    }
                  }}
                  className={`bg-[#134e4a] text-black p-2 rounded-md w-full font-bold hover:bg-[#0f766e] ${
                    oneObservation?.status === "approved" ? 'cursor-not-allowed' : 'cursor-pointer'
                  }`}>
                  {!isApprovingObservation || !isDeletingObservation || !isUpdatingReportUrl || !isUploadingReport || !generatingReport || !isFetchingObservationById
                    ? <span className='flex justify-center items-center text-white'>{oneObservation?.status === "approved" ? "Approved" : "Approve"}</span>
                    : <span className='flex justify-center items-center text-white'>{loader()}</span>
                  }
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    );
  };

  // show expanded report view
  const ExpandedReportView = () => {
    const [selectTab, setSelectTab] = useState(0);

    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-40">
      <div className="w-[90%] bg-[#2e2e2e] rounded-md">
        {/* header */}
        <div className="flex flex-row justify-between border-b border-[#a1a1aa] p-4">
          <p className="text-md">Observation details | Report</p>
          <button
            onClick={() => setShowExpandedReportView(!showExpandedReportView)}
            className={`flex items-center justify-center w-[24px] h-[24px] rounded-full shadow cursor-pointer hover:bg-[#151515] p-2`}>
              {isApprovingObservation || isDeletingObservation || isUpdatingReportUrl || isUploadingReport || generatingReport || isFetchingObservationById
                ? <span className='flex justify-center items-center text-black'>{loader()}</span>
                : <FontAwesomeIcon icon={faClose} />
              }
          </button>
        </div>
        <div className="flex flex-row p-4 gap-4 items-center justify-between">
          {/* show images as slider*/}
          <div className="flex flex-col gap-2 items-center w-1/2">
              <div className="flex flex-row gap-4 w-full px-10">
                  <button 
                    disabled={isFetchingObservationById}
                    onClick={() => {
                      setSelectTab(0);
                    }} 
                    className={`p-2 rounded-md w-full border border-[#aaaaaa] hover:underline cursor-pointer ${selectTab === 0 ? 'underline' : ''}`}>
                    {!isFetchingObservationById 
                      ? <span className='flex justify-center items-center text-white'><FontAwesomeIcon icon={faBrain} className="mr-2" />Show Scans</span>
                      : <span className='flex justify-center items-center text-white'>{loader()}</span>
                    }
                  </button>
                  <button 
                    disabled={isFetchingObservationById}
                    onClick={() => {
                      setSelectTab(1);
                    }} 
                    className={`p-2 rounded-md w-full border border-[#aaaaaa] hover:underline cursor-pointer ${selectTab === 1 ? 'underline' : ''}`}>
                    {!isFetchingObservationById 
                      ? <span className='flex justify-center items-center text-white'><FontAwesomeIcon icon={faFile} className="mr-2" />Show Report</span>
                      : <span className='flex justify-center items-center text-white'>{loader()}</span>
                    }
                  </button>
                </div>
            <div className="w-full mt-4">
              {selectTab === 0 
                ? (<ImageSlider images={oneObservation?.imageUrls!} />) 
                : (<ReportViewerPDF reportPdf={oneObservation?.reportUrl!} />)
              }
            </div>
          </div>
          <div className="w-1/2">
            {/* show conclusion */}
            <div className="">
                <p className="text-md">Conclusion</p>
                {!isFetchingObservationById
                    ? 
                <textarea
                  disabled={true}
                  value={oneObservation?.conclusionText || ''}
                  autoComplete="off"
                  id="conclusion1"
                  className="mt-2 placeholder:text-[#aaaaaa] placeholder:text-sm w-full px-4 py-3 text-white bg-transparent rounded border border-[#a1a1aa] focus:outline-none focus:border-white resize-none"
                  rows={4} // Specify the number of rows (height) of the textarea
                />
                : <span className='flex justify-center items-center text-white mt-2'>{loader()}</span>}
            </div>
            {/* show observation details */}
            <div className="mt-[40px] flex flex-col gap-6 justify-between items-start">
              <div className="w-full">
                <p className="text-md">Quick info</p>
                <div className="mt-2 flex flex-row gap-2 items-center justify-center">
                  <div className="flex flex-col gap-1 items-start justify-start w-1/2">
                    <p className="text-xs text-[#a1a1aa] block font-bold">Radiologist</p>
                    {!isFetchingObservationById
                    ? 
                    <input
                      disabled={true}
                      value={oneObservation?.radiologistName || ''}
                      autoComplete="off"
                        type="text"
                        id="radiologistName1"
                        className="w-2/3 mt-2 placeholder:text-[#aaaaaa] placeholder:text-sm w-full px-4 py-3 text-white text-sm bg-transparent rounded border border-[#a1a1aa] focus:outline-none focus:border-white"
                      />
                      : <span className='flex justify-center items-center text-white mt-2'>{loader()}</span>}
                  </div>
                  <div className="flex flex-col gap-1 items-start justify-start w-1/2">
                    <p className="text-xs text-[#a1a1aa] block font-bold">Head Doctor:</p>
                    {!isFetchingObservationById
                    ? 
                    <input
                      disabled={true}
                      value={oneObservation?.headDoctorName || headDoctorName}
                      autoComplete="off"
                        type="text"
                        id="headDoctorName1"
                        className="w-2/3 mt-2 placeholder:text-[#aaaaaa] placeholder:text-sm w-full px-4 py-3 text-white text-sm bg-transparent rounded border border-[#a1a1aa] focus:outline-none focus:border-white"
                      />
                      : <span className='flex justify-center items-center text-white mt-2'>{loader()}</span>}
                    </div>
                </div>
              </div>
              {/* show user details */}
              <div className="w-full">
                <p className="text-md">Patient info</p>
                <div className="mt-2 w-full flex flex-row gap-2 items-center justify-center">
                <div className="flex flex-col gap-1 items-start justify-start w-3/6">
                  <p className="text-xs text-[#a1a1aa] block font-bold">Full Name:</p>
                  {!isFetchingObservationById
                    ? 
                    <input
                        disabled={true}
                        value={oneObservation?.patientDetails.name || ''}
                        autoComplete="off"
                          type="text"
                          id="fullName1"
                          className="w-2/3 mt-2 placeholder:text-[#aaaaaa] placeholder:text-sm w-full px-4 py-3 text-sm text-white bg-transparent rounded border border-[#a1a1aa] focus:outline-none focus:border-white"
                        />
                  : <span className='flex justify-center items-center text-white mt-2'>{loader()}</span>
                }
                  </div>
                  <div className="flex flex-col gap-1 items-start justify-start w-1/6">
                  <p className="text-xs text-[#a1a1aa] block font-bold">Birth Year:</p>
                  {!isFetchingObservationById
                    ? 
                  <input
                    disabled={true}
                    value={oneObservation?.patientDetails.birthYear || ''}
                    autoComplete="off"
                      type="text"
                      id="birthYear1"
                      className="w-2/3 mt-2 placeholder:text-[#aaaaaa] placeholder:text-sm w-full px-4 py-3 text-sm text-white bg-transparent rounded border border-[#a1a1aa] focus:outline-none focus:border-white"
                    />
                  : <span className='flex justify-center items-center text-white mt-2'>{loader()}</span>
                }
                  </div>
                  <div className="flex flex-col gap-1 items-start justify-start w-2/6">
                  <p className="text-xs text-[#a1a1aa] block font-bold">Phone Number:</p>
                  {!isFetchingObservationById
                    ? 
                  <input
                  disabled={true}
                  value={oneObservation?.patientDetails.phoneNumber || ''}
                  autoComplete="off"
                  type="text"
                  id="phoneNumber1"
                  className="w-2/3 mt-2 placeholder:text-[#aaaaaa] placeholder:text-sm w-full px-4 py-3 text-sm text-white bg-transparent rounded border border-[#a1a1aa] focus:outline-none focus:border-white"
                  />
                  : <span className='flex justify-center items-center text-white mt-2'>{loader()}</span>
                }
                    </div>
                </div>
                  <div className="mt-4 flex flex-row gap-1 items-center justify-start">
                  <p className="text-xs text-[#a1a1aa] block font-bold">Status:</p>
                  {!isFetchingObservationById
                    ? 
                    <button 
                    disabled={true}
                    className={`bg-[#064e3b] text-black p-1 rounded-full w-[100px] text-xs`}>
                      <span className='flex justify-center items-center text-white text-xs'><FontAwesomeIcon icon={faCircleCheck} className="mr-2" />Approved</span>
                  </button>
                  : <span className='flex justify-center items-center text-white mt-2'>{loader()}</span>
                }
                    </div>
              </div>
            </div>
            {/* show action buttons */}
            <div className="flex flex-row gap-4 mt-[60px]">
                  <button 
                    disabled={isFetchingObservationById}
                    onClick={() => {
                      handleDeleteObservation();
                    }} 
                    className={`bg-[#7f1d1d] text-black p-2 rounded-md w-full font-bold hover:bg-[#b91c1c]`}>
                    {!isFetchingObservationById 
                      ? <span className='flex justify-center items-center text-white'><FontAwesomeIcon icon={faTrash} className="mr-2" />Delete</span>
                      : <span className='flex justify-center items-center text-white'>{loader()}</span>
                    }
                  </button>
                  <button 
                    disabled={isFetchingObservationById}
                    onClick={() => {
                      window.open(oneObservation!.reportUrl, '_blank');
                    }} 
                    className={`bg-[#a1a1aa] text-black p-2 rounded-md w-full font-bold hover:bg-[#f4f4f5]`}>
                    {!isFetchingObservationById 
                      ? <span className='flex justify-center items-center text-black'><FontAwesomeIcon icon={faPrint} className="mr-2" />Print</span>
                      : <span className='flex justify-center items-center text-black'>{loader()}</span>
                    }
                  </button>
                  <button 
                    disabled={isFetchingObservationById}
                    onClick={() => {
                      shareReport();
                    }} 
                    className={`bg-[#134e4a] text-black p-2 rounded-md w-full font-bold hover:bg-[#0f766e]`}>
                    {!isFetchingObservationById 
                      ? <span className='flex justify-center items-center text-white'><FontAwesomeIcon icon={faShare} className="mr-2" />Share</span>
                      : <span className='flex justify-center items-center text-white'>{loader()}</span>
                    }
                  </button>
                </div>
          </div>
        </div>
      </div>
    </div>
    );
  };

  // export interface ShareReport {
  //     id: string;
  //     observationId: string;
  //     hospitalId: string;
  //     patientId: string;
  //     reportUrl: string;
  //     createdAt?: Timestamp;
  // }
  // update observation reportUrl in firestore
  const updateObservationReportUrl = async (url: string) => {
    setIsUpdatingReportUrl(true);
    console.log('updating report url');
    triggerNotification('Updating report URL...', 'info');
    try {
      // udpate on reports collection
      const reportRef = await addDoc(collection(firestore, 'hospitals', hospitalId, 'reports'), {
        observationId: oneObservation?.id!,
        hospitalId: hospitalId,
        patientId: oneObservation?.patientId!,
        coverImageUrl: oneObservation?.imageUrls[0],
        reportUrl: url,
        createdAt: new Date(),
      });
      // update on observations collection
      const observationRef = doc(firestore, 'hospitals', hospitalId, 'observations', oneObservation?.id!);
      await updateDoc(observationRef, {
        reportUrl: url,
      });
      console.log('Report URL updated with ID:', reportRef.id);
      triggerNotification('Report URL updated successfully', 'success');
      return true;
    } catch (error) {
      console.error('Error updating report URL:', error);
      triggerNotification('An error occurred while updating report URL', 'error');
    } finally {
      setIsUpdatingReportUrl(false);
      setRefetchOneObservation(!refetchOneObservation);
    }
  };

  // generate report
  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    console.log('generating report');
    triggerNotification('Generating report...', 'info');
    try {
      const reportData: ReportProps = {
        report: {
          patientDetails: oneObservation?.patientDetails!,
          hospitalDetails: oneObservation?.hospitalDetails!,
          imageUrls: oneObservation?.imageUrls!,
          conclusionText: oneObservation?.conclusionText!,
          radiologistName: oneObservation?.radiologistName!,
          headDoctorName: headDoctorName,
          createdAt: oneObservation?.createdAt!,
        }
      }
      // POST request to generate the report
      const result = await fetch('/api/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      });

      if (result.ok) {
        const { downloadUrl } = await result.json();
        console.log('PDF report generated and uploaded. Download URL:', downloadUrl);
        triggerNotification('Report generated and uploaded successfully.', 'success');
  
        // Open the generated PDF in a new tab
        window.open(downloadUrl, '_blank');
        return downloadUrl;
      } else {
        console.error('Error generating report:', await result.text());
        triggerNotification('An error occurred while generating report', 'error');
        return false;
      }
    } catch (error) {
      console.error('Error generating report:', error);
      triggerNotification('An error occurred while generating report', 'error');
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleApproveObservation = async () => {
    setIsApprovingObservation(true);
    console.log('approving observation');
    triggerNotification('Approving observation...', 'info');
    // update observation status to approved in firestore
    try {
      const observationRef = doc(firestore, 'hospitals', hospitalId, 'observations', oneObservation?.id!);
      await updateDoc(observationRef, {
        headDoctorName: headDoctorName,
        status: 'approved',
      });
      triggerNotification('Observation approved successfully', 'success');
      return true;
    } catch (error) {
      console.error('Error approving observation:', error);
      triggerNotification('An error occurred while approving observation', 'error');
    } finally {
      setIsApprovingObservation(false);
    }
  };

  useEffect(() => {
    fetchObservationById(oneObservation?.id!);
  }, [refetchOneObservation]);

  const handleDeleteObservation = async () => {
    setIsDeletingObservation(true);
    console.log('deleting observation');
    triggerNotification('Deleting observation...', 'info');
    // delete observation from firestore
    try {
      const observationRef = doc(firestore, 'hospitals', hospitalId, 'observations', oneObservation?.id!);
      await deleteDoc(observationRef);
      triggerNotification('Observation deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting observation:', error);
      triggerNotification('An error occurred while deleting observation', 'error');
    } finally {
      setIsDeletingObservation(false);
      setShowExpandedObservation(false);
      // initiliaze specific observation state
      setOneObservation(null);
    }
  };

  const handleRegenerateConclusion = async () => {
    setIsRegeneratingConclusion(true);
    console.log('regenerating conclusion');
    await handleGenerateConclusion(segmentResult);
    setIsRegeneratingConclusion(false);
  };
  
  const handleSaveObservation = async () => {
    // setIsAddingScanAndPatient(true);
    setIsSavingObservation(true);
    
    // TODO: need to check again
    // // upload scans to firebase storage
    // await uploadScansToFirebaseStorage();
    // if (scanUrls.length === 0) {
    //   triggerNotification('Something went wrong on setScanUrls state', 'error');
    //   setIsSavingObservation(false);
    //   return
    // }

    // save patient details to firestore
    const pId = await savePatientDetails();
    if (pId) {
      // save observation to firestore
      const oId = await saveObservation(pId);
      if (oId) {
        setIsSavingObservation(false);
        setShowExpandedConclusion(false);
        // re-fetch all observations
        setRefetch(!refetch);
        // initiliaze all states
        console.log("all states are initialized");
        setPatientName('');
        setPatientBirthYear('');
        setPatientPhoneNumber('');
        setScanUrls([]);
        setPatientId('');
        setConclusion('');
        setRadiologistName('');
        setDroppedFiles([]);

        setShowPortalView(true);
      } else {
        triggerNotification('Something went wrong on saveObservation state', 'error');
        setIsSavingObservation(false);
        return
      }
    }
  };

  // show expanded conclusion
  const ExpandedConclusionView = () => {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-40">
      <div className="w-[90%] bg-[#2e2e2e] rounded-md">
        {/* header */}
        <div className="flex flex-row justify-between border-b border-[#a1a1aa] p-4">
          <p className="text-md">Generated conclusion</p>
          <button
            onClick={() => setShowExpandedConclusion(!showExpandedConclusion)}
            className={`flex items-center justify-center w-[24px] h-[24px] rounded-full shadow cursor-pointer hover:bg-[#151515] p-2`}>
              {isAddingScanAndPatient || isRegeneratingConclusion || isDeletingObservation || isSavingObservation || isSegmentingScans
                ? <span className='flex justify-center items-center text-white'>{loader()}</span>
                : <FontAwesomeIcon icon={faClose} />
              }
          </button>
        </div>
        <div className="flex flex-row p-4 gap-4 items-center justify-between">
          {/* show images as slider*/}
          <div className="w-1/2">
            <ImageSlider images={scanUrls} />
          </div>
          <div className="w-1/2">
            {/* show conclusion */}
            <div className="">
                <p className="text-md">Conclusion</p>
                {(isGeneratingConclusion || isSegmentingScans || isRegeneratingConclusion)
                  ? loader() 
                  : (
                    <textarea
                      value={conclusion}
                      onChange={(e) => setConclusion(e.target.value)} // Append the last typed character
                      autoComplete="off"
                      id="conclusion"
                      className="mt-2 placeholder:text-[#aaaaaa] placeholder:text-sm w-full px-4 py-3 text-white bg-transparent rounded border border-[#a1a1aa] focus:outline-none focus:border-white resize-none"
                      rows={4} // Specify the number of rows (height) of the textarea
                    />
                  )
                }
            </div>
            {/* show observation details */}
            <div className="mt-[40px] flex flex-col gap-6 justify-between items-start">
              <div className="w-full">
                <p className="text-md">Quick info <span className="text-[#a1a1aa] text-xs">(fill it out)</span></p>
                <div className="mt-2 flex flex-row gap-2 items-start justify-start">
                  <div className="flex flex-col gap-1 items-start justify-start w-1/2">
                    <p className="text-xs text-[#a1a1aa] block font-bold">Radiologist <span className="text-red-500">*</span></p>
                    <input
                      value={radiologistName}
                      onChange={(e) => setRadiologistName(e.target.value)}
                      autoComplete="off"
                        type="text"
                        id="radiologistName"
                        placeholder="Enter radiologist name"
                        className="w-2/3 mt-2 placeholder:text-[#aaaaaa] placeholder:text-sm w-full px-4 py-3 text-white text-sm bg-transparent rounded border border-[#a1a1aa] focus:outline-none focus:border-white"
                      />
                  </div>
                </div>
              </div>
              {/* show user details */}
              <div className="w-full">
                <p className="text-md">Patient info</p>
                <div className="mt-2 w-full flex flex-row gap-2 items-center justify-center">
                <div className="flex flex-col gap-1 items-start justify-start w-3/6">
                  <p className="text-xs text-[#a1a1aa] block font-bold">Full Name:</p>
                  <input
                      disabled={true}
                      value={patientName}
                      autoComplete="off"
                        type="text"
                        id="fullName"
                        placeholder="Enter your Patient ID"
                        className="w-2/3 mt-2 placeholder:text-[#aaaaaa] placeholder:text-sm w-full px-4 py-3 text-sm text-white bg-transparent rounded border border-[#a1a1aa] focus:outline-none focus:border-white"
                      />
                  </div>
                  <div className="flex flex-col gap-1 items-start justify-start w-1/6">
                  <p className="text-xs text-[#a1a1aa] block font-bold">Birth Year:</p>
                  <input
                    disabled={true}
                    value={patientBirthYear}
                    autoComplete="off"
                      type="text"
                      id="birthYear"
                      placeholder="Enter your Patient ID"
                      className="w-2/3 mt-2 placeholder:text-[#aaaaaa] placeholder:text-sm w-full px-4 py-3 text-sm text-white bg-transparent rounded border border-[#a1a1aa] focus:outline-none focus:border-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1 items-start justify-start w-2/6">
                  <p className="text-xs text-[#a1a1aa] block font-bold">Phone Number:</p>
                  <input
                    disabled={true}
                    value={patientPhoneNumber}
                    autoComplete="off"
                      type="text"
                      id="phoneNumber"
                      placeholder="Enter your Patient ID"
                      className="w-2/3 mt-2 placeholder:text-[#aaaaaa] placeholder:text-sm w-full px-4 py-3 text-sm text-white bg-transparent rounded border border-[#a1a1aa] focus:outline-none focus:border-white"
                    />
                    </div>
                </div>
              </div>
            </div>
            {/* show action buttons */}
            <div className="flex flex-row gap-4 mt-[60px]"> 
              <button 
                    disabled={isRegeneratingConclusion || isDeletingObservation || isSavingObservation || isSegmentingScans}
                  onClick={() => {
                    handleDeleteObservation();
                  }} 
                  className={`bg-[#7f1d1d] text-black p-2 rounded-md w-full font-bold hover:bg-[#b91c1c]`}>
                  {(!isRegeneratingConclusion || !isDeletingObservation || !isSavingObservation || !isSegmentingScans)
                    ? <span className='flex justify-center items-center text-white'>Delete</span>
                    : <span className='flex justify-center items-center text-white'>{loader()}</span>
                  }
                </button>
              <button 
                    disabled={isRegeneratingConclusion || isDeletingObservation || isSavingObservation || isSegmentingScans}
                  onClick={() => {
                    handleRegenerateConclusion();
                  }} 
                  className={`bg-[#0c4a6e] text-black p-2 rounded-md w-full font-bold hover:bg-[#0369a1]`}>
                  {(!isRegeneratingConclusion || !isDeletingObservation || !isSavingObservation || !isSegmentingScans)
                    ? <span className='flex justify-center items-center text-white'>Regenerate</span>
                    : <span className='flex justify-center items-center text-white'>{loader()}</span>
                  }
                </button>
              <button 
                    disabled={isRegeneratingConclusion || isDeletingObservation || radiologistName.trim() === '' || isSavingObservation || isSegmentingScans}
                  onClick={() => {
                    handleSaveObservation();
                  }} 
                  className={`bg-[#134e4a] text-black p-2 rounded-md w-full font-bold hover:bg-[#0f766e] ${
                    radiologistName.trim() === '' ? 'cursor-not-allowed' : 'cursor-pointer'
                  }`}>
                  {(!isRegeneratingConclusion || !isDeletingObservation || !isSavingObservation || !isSegmentingScans)
                    ? <span className='flex justify-center items-center text-white'>Save</span>
                    : <span className='flex justify-center items-center text-white'>{loader()}</span>
                  }
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    );
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      // Append new files to the existing droppedFiles state onle if file was not already dropped
      if (droppedFiles.length === 3) {
        triggerNotification('You can only upload up to 3 files at a time', 'error');
        return;
      }
      const newFiles = Array.from(files).filter(file => !droppedFiles.some(f => f.name === file.name));
      setDroppedFiles((prevFiles) => [...prevFiles, ...newFiles]);
    }
  };

  const handleRemoveFile = (fileName: string) => {
    // Remove file by filtering out the clicked file
    setDroppedFiles((prevFiles) => prevFiles.filter(file => file.name !== fileName));
  };

  const handleSelectScansClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click(); // Trigger the file input click programmatically
    }
  };

  const UploadImageView = () => {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-40">
      <div className="w-[800px] bg-[#2e2e2e] rounded-md">
        {/* header */}
        <div className="flex flex-row justify-between border-b border-[#a1a1aa] p-4">
          <p className="text-md">Add patient & scans</p>
          <button
            onClick={() => setShowUploadImageView(!showUploadImageView)}
            className={`flex items-center justify-center w-[24px] h-[24px] rounded-full shadow cursor-pointer hover:bg-[#151515] p-2`}>
              {!isAddingScanAndPatient
                ? <FontAwesomeIcon icon={faClose} />
                : <span className='flex justify-center items-center text-white'>{loader()}</span>
              }
          </button>
        </div>
        <div className="p-4">
          {/* workspace */}
          <div className="flex flex-row justify-between border border-[#a1a1aa] p-4 rounded-md">
            <p className="text-md">Workspace: <span className="text-md ml-[20px] text-[#aaaaaa]">{user?.fullName}&apos;s workspace...</span></p>
            <button
              onClick={() => {}}
              className={`flex items-center justify-center w-[24px] h-[24px] rounded-full shadow cursor-pointer`}>
                {!isAddingScanAndPatient
                  ? <FontAwesomeIcon icon={faChevronDown} />
                  : <span className='flex justify-center items-center text-white'>{loader()}</span>
                }
            </button>
          </div>
          <div className="mt-[30px] flex flex-row justify-between gap-[40px]">
            {/* upload scans */}
            <div className="flex flex-col justify-between border border-[#a1a1aa] rounded-md w-1/2">
              <div className="flex items-center justify-center h-64 w-full">
                {/* Hidden file input */}
                <input
                  type="file"
                  className="hidden"
                  ref={fileInputRef} // Attach ref to the input
                  id="file-upload"
                  onChange={handleFileChange}
                  multiple
                />

                {droppedFiles.length === 0 ? (
                  <div className="flex items-center justify-center h-full w-full">
                    <label
                      htmlFor="file-upload"
                      className="flex flex-col items-center justify-center cursor-pointer h-full w-full"
                      onClick={handleSelectScansClick} // Handle click to open file dialog
                    >
                      <div className="flex flex-col items-center justify-center">
                        <FontAwesomeIcon icon={faFile} size="3x" />
                        <p className="mb-2 mt-2 text-sm text-gray-500">
                          <span className="font-semibold text-[#aaaaaa]">Drag & drop files</span>
                        </p>
                        <p className="text-xs text-[#aaaaaa]">(Only DICOM, PNG, JPEG files supported)</p>
                      </div>
                    </label>
                  </div>
                ) : (
                  <div className="flex flex-row gap-4 items-center justify-center w-full overflow-auto">
                    <div className="flex flex-col gap-2 items-center justify-center h-full w-full">
                      {droppedFiles.map((file) => (
                        <div key={file.name} className="flex flex-row gap-2 items-center justify-center">
                          <div className="flex flex-col items-start justify-start p-2 border border-[#a1a1aa] rounded-md">
                            <p className="text-xs text-white">
                              File name: <span className="text-[#aaaaaa]"><FontAwesomeIcon icon={faPenNib} className="mr-1" />{file.name}</span>
                            </p>
                            <p className="text-xs text-white">
                              Series/Instance: <span className="text-[#aaaaaa]"><FontAwesomeIcon icon={faClone} className="mr-1" />1</span>
                            </p>
                            <p className="text-xs text-white">
                              Status: <span className="text-[#0f766e]"><FontAwesomeIcon icon={faCircleCheck} className="mr-1" />Valid format</span>
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveFile(file.name)}
                            className="flex items-center justify-center w-[24px] h-[24px] rounded-full shadow cursor-pointer hover:bg-[#151515] p-2 mt-2"
                          >
                            <FontAwesomeIcon icon={faMinus} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* "Select Scan(s)" button to trigger file input */}
              <button
                disabled={droppedFiles.length === 3}
                onClick={handleSelectScansClick} // Use the ref click handler
                className={`bg-[#a1a1aa] text-black p-2 rounded-md w-full font-bold hover:bg-[#f4f4f5] ${
                  droppedFiles.length === 3 ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span className='flex justify-center items-center text-black'>Select Scan(s)</span>
              </button>
            </div>
            {/* user info */}
            <div className="w-1/2">
              {/* Patient ID */}
              <div className="mb-4">
                <p className="block text-white text-xs font-bold mb-2">
                  Patient ID
                </p>
                <input
                value={patientId}
                onChange={(e) => {
                  console.log(e.target.value)
                  setPatientId(e.target.value)
                }}
                autoComplete="off"
                  type="text"
                  name="id"
                  placeholder="Enter your Patient ID"
                  className="placeholder:text-[#aaaaaa] placeholder:text-sm w-full px-4 py-3 text-white bg-transparent rounded border border-[#a1a1aa] focus:outline-none focus:border-white"
                />
              </div>

              {/* Full Name */}
              <div className="mb-4">
                <p className="block text-white text-xs font-bold mb-2">
                  Full Name <span className="text-red-500">*</span>
                </p>
                <input
                value={patientName}
                onChange={(e) => {setPatientName(e.target.value)}}
                autoComplete="off"
                  type="text"
                  name="fullname"
                  placeholder="Enter first, middle and last name"
                  className="placeholder:text-[#aaaaaa] placeholder:text-sm w-full px-4 py-3 text-white bg-transparent rounded border border-[#a1a1aa] focus:outline-none focus:border-white"
                />
              </div>

              {/* Age and Birth Gender */}
              <div className="flex mb-4">
                {/* Age */}
                <div className="w-1/3 pr-2">
                  <p className="block text-white text-xs font-bold mb-2">
                    Birth Year <span className="text-red-500">*</span>
                  </p>
                  <div className="flex items-center">
                    <input
                    value={patientBirthYear}
                    onChange={(e) => setPatientBirthYear(e.target.value)}
                    autoComplete="off"
                      type="text"
                      name="age"
                      placeholder="Birth year"
                      className="placeholder:text-[#aaaaaa] placeholder:text-sm w-full px-4 py-3 text-white bg-transparent rounded border border-[#a1a1aa] focus:outline-none focus:border-white"
                    />
                  </div>
                </div>
                {/* Phone Number */}
                <div className="w-2/3 pl-2">
                  <p className="block text-white text-xs font-bold mb-2">
                    Phone Number
                  </p>
                  <input
                  value={patientPhoneNumber}
                  onChange={(e) => setPatientPhoneNumber(e.target.value)}
                    autoComplete="off"
                    type="text"
                    name="phone"
                    placeholder="Enter patient's phone number"
                    className="placeholder:text-[#aaaaaa] placeholder:text-sm w-full px-4 py-3 text-white bg-transparent rounded border border-[#a1a1aa] focus:outline-none focus:border-white"
                  />
                </div>
              </div>
              {/* Proceed */}
              <button 
                disabled={isAddingScanAndPatient || patientName === '' || patientBirthYear === '' || droppedFiles.length === 0}
                onClick={proceedWithScans} 
                className={`bg-[#134e4a] text-white p-2 rounded-md w-full font-bold ${ 
                  (isAddingScanAndPatient || patientName === '' || patientBirthYear === '' || droppedFiles.length === 0) ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-[#0f766e]'}`}>
                {!isAddingScanAndPatient 
                  ? <span className='flex justify-center items-center text-white'>Proceed</span>
                  : <span className='flex justify-center items-center text-white'>{loader()}</span>
                }
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
    );
  };

  const saveHospitalDetails = async () => {
    setIsSavingHospitalDetails(true);
    console.log('saving hospital details');
    triggerNotification('Saving hospital details...', 'info');
    try {
      await registerHospital(hospitalId);
      triggerNotification('Hospital details saved successfully', 'success');
    } catch (error) {
      console.error('Error saving hospital details:', error);
      triggerNotification('An error occurred while saving hospital details', 'error');
    } finally {
      setIsSavingHospitalDetails(false);
      setShowHospitalDetailsView(false);
    }
  };

  const HospitalDetailsView = () => {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-40">
      <div className="w-[800px] bg-[#2e2e2e] rounded-md">
        <div className="flex flex-row justify-between border-b border-[#a1a1aa] p-4">
          <p className="text-md">Add hospital details</p>
        </div>
        <div className="p-4">
          <div className="flex flex-row justify-start border border-[#a1a1aa] p-4 rounded-md">
            <button
              onClick={() => {}}
              className={`flex items-center justify-center w-[24px] h-[24px] rounded-full shadow cursor-pointer`}>
                <FontAwesomeIcon icon={faCircleInfo} />
            </button>
            <p className="text-md ml-[20px]">Make sure details are correct so it reflects in the <span className="text-md underline font-bold">report</span></p>
          </div>
          <div className="mt-[30px] flex flex-row justify-between gap-[40px]">
            <div className="w-full">
              <div className="mb-4">
                <p className="block text-white text-xs font-bold mb-2">
                  Hospital Name <span className="text-red-500">*</span>
                </p>
                <input
                value={hFullName}
                onChange={(e) => {
                  console.log(e.target.value)
                  setHFullName(e.target.value)
                }}
                autoComplete="off"
                  type="text"
                  name="hFullName"
                  placeholder="Enter hospital name"
                  className="placeholder:text-[#aaaaaa] placeholder:text-sm w-full px-4 py-3 text-white bg-transparent rounded border border-[#a1a1aa] focus:outline-none focus:border-white"
                />
              </div>
              <div className="mb-4">
                <p className="block text-white text-xs font-bold mb-2">
                  Department Name <span className="text-red-500">*</span>
                </p>
                <input
                value={hDepartment}
                onChange={(e) => {setHDepartment(e.target.value)}}
                autoComplete="off"
                  type="text"
                  name="hDepartment"
                  placeholder="Enter department name"
                  className="placeholder:text-[#aaaaaa] placeholder:text-sm w-full px-4 py-3 text-white bg-transparent rounded border border-[#a1a1aa] focus:outline-none focus:border-white"
                />
              </div>
              <div className="mb-4">
                <p className="block text-white text-xs font-bold mb-2">
                  Full Address <span className="text-red-500">*</span>
                </p>
                <div className="flex items-center">
                  <input
                  value={hAddress}
                  onChange={(e) => setHAddress(e.target.value)}
                  autoComplete="off"
                    type="text"
                    name="hAddress"
                    placeholder="Enter hospital address"
                    className="placeholder:text-[#aaaaaa] placeholder:text-sm w-full px-4 py-3 text-white bg-transparent rounded border border-[#a1a1aa] focus:outline-none focus:border-white"
                  />
                </div>
              </div>
              <div className="mb-4">
                <p className="block text-white text-xs font-bold mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </p>
                <input
                value={hPhone}
                onChange={(e) => setHPhone(e.target.value)}
                  autoComplete="off"
                  type="text"
                  name="hPhone"
                  placeholder="Enter phone number"
                  className="placeholder:text-[#aaaaaa] placeholder:text-sm w-full px-4 py-3 text-white bg-transparent rounded border border-[#a1a1aa] focus:outline-none focus:border-white"
                />
              </div>
              <button 
                disabled={isSavingHospitalDetails || hFullName === '' || hDepartment === '' || hAddress === '' || hPhone === ''}
                onClick={saveHospitalDetails} 
                className={`bg-[#134e4a] text-white p-2 rounded-md w-full font-bold ${ 
                  (isSavingHospitalDetails || hFullName === '' || hDepartment === '' || hAddress === '' || hPhone === '') ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-[#0f766e]'}`}>
                {!isAddingScanAndPatient 
                  ? <span className='flex justify-center items-center text-white'>Submit</span>
                  : <span className='flex justify-center items-center text-white'>{loader()}</span>
                }
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
    );
  };

  const BlurImage = ({ children }: { children: React.ReactNode }) => {
    const [isRevealed, setIsRevealed] = useState(false);

    const handleRevealClick = () => {
      setIsRevealed(true); // Reveal the image
      setTimeout(() => {
        setIsRevealed(false); // Reveal the image
      }, 3000); // Simulated delay for fetching or loading
    };

    return (
<div className="flex flex-row gap-4 flex-wrap justify-center m-auto">
      <div className="relative shadow-lg rounded-md group">
        <div className={`${isRevealed ? 'blur-0' : 'blur-md'} transition-all duration-300 rounded-md`}>
          {children}
        </div>
        {!isRevealed && (
          <div className="absolute inset-0 z-30 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-md">
            <button
              onClick={handleRevealClick}
              className={`bg-[#3f3f46] text-white px-5 py-3 rounded-md font-bold hover:bg-[#a1a1aa] cursor-pointer`}
            >
              <span className="flex justify-center items-center">
                <FontAwesomeIcon icon={faEye} className="mr-2" />
                {'Show'}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
    );
  };

  const ReportView = () => {
return (
      <div className="flex flex-col items-center justify-center block">
        <div className="flex flex-row flex-wrap gap-8 items-center justify-start">
            {reportViewData.map((obs, index) => (
              <div key={obs.observationId+'_'+index} className="flex flex-col justify-between gap-2">
                {/* show report pdf preview */}
                <div className="flex items-center justify-center p-2 border border-[#a1a1aa] rounded-md">
                  <BlurImage>
                    <Image
                      priority={true}
                      src={obs.coverImageUrl}
                      alt={`Observation Image ${index}`}
                      width={300}  // Adjust the width as needed
                      height={300} // Adjust the height as needed
                      className="rounded width-auto height-auto"
                    />
                  </BlurImage>
                </div>
              <div className="flex flex-row gap-2">
                  <button 
                    disabled={isFetchingObservationById}
                    onClick={() => {
                      console.log('fetching observation by id:', obs.observationId);
                      fetchObservationByIdForReportView(obs.observationId);
                      setShowExpandedReportView(!showExpandedReportView);
                    }} 
                    className={`bg-[#0c4a6e] text-black p-2 rounded-md w-full font-bold hover:bg-[#0369a1]`}>
                    {!isFetchingObservationById 
                      ? <span className='flex justify-center items-center text-white'><FontAwesomeIcon icon={faExpand} className="mr-2" />Expand</span>
                      : <span className='flex justify-center items-center text-white'>{loader()}</span>
                    }
                  </button>
                  <button 
                    disabled={isFetchingObservationById}
                    onClick={() => {
                      window.open(obs.reportUrl, '_blank');
                    }} 
                    className={`bg-[#a1a1aa] text-black p-2 rounded-md w-full font-bold hover:bg-[#f4f4f5]`}>
                    {!isFetchingObservationById 
                      ? <span className='flex justify-center items-center text-black'><FontAwesomeIcon icon={faPrint} className="mr-2" />Print</span>
                      : <span className='flex justify-center items-center text-black'>{loader()}</span>
                    }
                  </button>
                  <button 
                    disabled={isFetchingObservationById}
                    onClick={() => {
                      shareReport();
                    }} 
                    className={`bg-[#134e4a] text-black p-2 rounded-md w-full font-bold hover:bg-[#0f766e]`}>
                    {!isFetchingObservationById 
                      ? <span className='flex justify-center items-center text-white'><FontAwesomeIcon icon={faShare} className="mr-2" />Share</span>
                      : <span className='flex justify-center items-center text-white'>{loader()}</span>
                    }
                  </button>
                </div>
            </div>
            ))}
        </div>
    </div>
    );
  };

return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 relative text-white">
              {/* show notification */}
                {notification && (
                <Notification
                message={notification.message}
                type={notification.type}
                onClose={() => setNotification(null)}
                />
            )}
      {/* sidebar */}
      <aside className="absolute top-0 left-0 lg:w-2/12 w-3/12 h-full bg-[#151515]">
        <div className="flex flex-col items-start justify-start h-full space-y-8">
            <div>
              <p className="mt-[50px] ml-[20px] text-[46px] font-bold">Medina AI</p>
            </div>
          {/* navigations */}
          <div className="mt-[100px] ml-[20px] flex flex-col gap-4">
          <div>
              {/* <p className="text-sm text-[#eeeeee]">Navigation</p> */}
            </div>
            {/* show upload image view */}
            <div>
              <button 
                onClick={handleShowUploadImageView}
                className={`text-md cursor-pointer w-full hover:underline border border-white rounded-md px-4 py-4 flex items-center ${showUploadImageView ? 'underline' : ''}`}
              ><FontAwesomeIcon icon={faAdd} className="mr-2"/> Upload Scan(s)</button>
            </div>
            {/* show portal view */}
            <div>
              <button 
                onClick={handleShowPortalView}
                className={`text-md cursor-pointer w-full hover:underline border border-white rounded-md px-4 py-4 flex items-center ${showPortalView ? 'underline' : ''}`}
              ><FontAwesomeIcon icon={faCompass} className="mr-2"/>Observations</button>
            </div>
            {/* show report view */}
            <div>
              <button 
                onClick={handleShowReportView}
                className={`text-md cursor-pointer w-full hover:underline border border-white rounded-md px-4 py-4 flex items-center ${showReportView ? 'underline' : ''}`}
              ><FontAwesomeIcon icon={faFile} className="mr-2"/>Reports</button>
            </div>
          </div>
          {/* account settings */}
          <div className="absolute bottom-[20px] left-[20px]">
          <SignedIn>
        <UserButton />
      </SignedIn>
          </div>
        </div>
      </aside>
      {/* main playground */}
      <aside className="absolute top-0 right-0 lg:w-10/12 w-9/12 h-full overflow-auto">
        <div className="flex flex-col items-center justify-center p-8">
          {showHospitalDetailsView && (
            <HospitalDetailsView />)}
          {!showUploadImageView && !showPortalView && !showReportView && (
            <div className="h-10/12">
                            {defaultViewObservations.length !== 0 
                ? (<DefaultView />) 
                : (<p className="">{loader()}</p>)
              }
            </div>
            )}
            {/* show expand conclusion view */}
            {showExpandedConclusion && (
              <ExpandedConclusionView />
            )}
            {/* show expanded view */}
            {showExpandedObservation && (
              <>
                {oneObservation !== null 
                  ? (<ExpandedObservationView />) 
                  : (<p className="">{loader()}</p>)
                }
              </>
            )}
            {/* show expanded report view */}
            {showExpandedReportView && (
              <>
                {oneObservation !== null 
                  ? (<ExpandedReportView />) 
                  : (<p className="">{loader()}</p>)
                }
              </>
            )}
          {/* on show upload image view */}
          {showUploadImageView && (
            <div className="h-10/12">
              <UploadImageView />
            </div>
            )}
          {/* on show portal view */}
          {showPortalView && (
            <div className="h-10/12">
              {defaultViewObservations.length !== 0 
                ? (<DefaultView />) 
                : (<p className="">{loader()}</p>)
              }
            </div>
            )}
          {/* on show report view */}
          {showReportView && (
            <div className="h-10/12">
              {reportViewData.length !== 0 || !isFetchingReports
                ? (<ReportView />) 
                : (<p className="">{loader()}</p>)
              }
            </div>
            )}
        </div>
      </aside>
    </main>
  );
}
