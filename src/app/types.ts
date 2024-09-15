import { Timestamp } from "firebase/firestore";

export interface Patient {
    id: string;
    name: string;
    birthYear: string;
    phoneNumber: string;
}

export interface Observation {
    id: string;
    patientId: string;
    imageUrls: [string];
    conclusionText: string;
    radiologistName: string;
    headDoctorName: string;
    reportUrl: string;
    status: string;
    updatedAt?: Timestamp;
    createdAt?: Timestamp;
}

export interface ObservationDefaultView {
    id: string;
    imageUrl: string;
    updatedAt?: Timestamp;
    createdAt?: Timestamp;
}

export interface Hospital {
    id: string;
    name: string;
    department: string;
    address: string;
    phone: string;
    email: string;
}

export interface PatientObservation {
    id: string;
    patientId: string;
    patientDetails: Patient;
    hospitalDetails: Hospital;
    imageUrls: [string];
    conclusionText: string;
    radiologistName: string;
    headDoctorName: string;
    reportUrl: string;
    status: string;
    updatedAt?: Timestamp;
    createdAt?: Timestamp;
}

export interface ShareReport {
    id: string;
    observationId: string;
    hospitalId: string;
    patientId: string;
    coverImageUrl: string;
    reportUrl: string;
    createdAt?: Timestamp;
}

export interface ReportProps {
    report: {
        patientDetails: Patient,
        hospitalDetails: Hospital,
        imageUrls: string[],
        conclusionText: string,
        radiologistName: string,
        headDoctorName: string,
        createdAt: Timestamp,
    };
}