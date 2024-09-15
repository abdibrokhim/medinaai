import { Page, Text, View, Document, StyleSheet, renderToStream, Image, Font } from '@react-pdf/renderer';
import { Timestamp } from 'firebase/firestore';
import { NextResponse } from 'next/server';
import { Patient, Observation, Hospital, PatientObservation, ObservationDefaultView, ShareReport, ReportProps } from '../../types';

const studyType = "PROTOCOL OF MRI STUDY OF THE BRAIN";
const disclaimerA = 'This conclusion is not a final diagnosis and requires comparison with clinical and laboratory data.';
const disclaimerB = `In case of typos, contact phone: `;

Font.register({
  family: 'Oswald',
  src: 'https://fonts.gstatic.com/s/oswald/v13/Y_TKV6o8WovbUd3m_X9aAA.ttf'
});

const styles = StyleSheet.create({
  body: {
    paddingTop: 35,
    paddingBottom: 65,
    paddingHorizontal: 35,
  },
  subSubTitle: {
    fontSize: 16,
    textAlign: 'left',
    fontFamily: 'Oswald'
  },
  infoHeader: {
    borderBottom: 1,
    marginBottom: 4,
    fontSize: 10,
    textAlign: 'left',
    fontFamily: 'Oswald'
  },
  author: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 40,
  },
  subtitle: {
    fontSize: 16,
    margin: 10,
    fontFamily: 'Oswald'
  },
  headerTitle: {
    fontSize: 14,
    marginTop: 6,
    marginBottom: 6,
    fontFamily: 'Oswald'
  },
  headerTitleWithBorder: {
    borderBottom: 1,
    fontSize: 14,
    marginTop: 6,
    marginBottom: 6,
    fontFamily: 'Oswald'
  },
  headerTitleCentered: {
    textAlign: 'center',
    fontSize: 10,
    marginTop: 6,
    marginBottom: 6,
    fontFamily: 'Oswald'
  },
  makeRow: {
    marginTop: 4,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  text: {
    marginTop: 2,
    marginBottom: 2,
    fontSize: 8,
    fontFamily: 'Times-Roman'
  },
  notes: {
    marginTop: 1,
    marginBottom: 2,
    fontSize: 6,
    textAlign: 'left',
    fontFamily: 'Times-Roman'
  },
  headerText: {
    fontSize: 8,
    fontFamily: 'Times-Roman'
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 10,
  },
  imageCenter: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  header: {
    marginBottom: 10,
    textAlign: 'center',
    color: 'black',
  },
  footer: {
    marginBottom: 20,
    textAlign: 'center',
    color: 'grey',
    bottom: 10,
    margin: 'auto',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 6,
    textAlign: 'center',
    marginBottom: 4,
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 12,
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: 'grey',
  },
  section: {
    marginBottom: 10
  },
  main: {
    position: 'relative',
  },
  border: {
    border: 1,
    paddingVertical: 100,
    paddingHorizontal: 100,
    marginBottom: 10,
  },
});

interface ReportTemplateProps {
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

function formatTimestampToDate(timestamp: { seconds: number; nanoseconds: number }): string {
  const milliseconds = timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000;
  const date = new Date(milliseconds);
  return date.toLocaleDateString('en-US');
}

const ReportTemplate = ({ report } : ReportTemplateProps) => {
  return (
    <Document>
      <Page style={styles.body}>
        <View style={styles.main}>
          <View style={styles.header}>
            <Text style={styles.headerTitleWithBorder}>{report.hospitalDetails.name.toUpperCase()}</Text>
            <Text style={styles.headerTitle}>{report.hospitalDetails.department.toUpperCase()}</Text>
            <Text style={styles.headerText}>{report.hospitalDetails.address}</Text>
          </View>
          <View style={styles.makeRow}>
            <View style={styles.section}>
              <Text style={styles.infoHeader}>{'Patient Infos'.toUpperCase()}</Text>
              <Text style={styles.text}>Name: {report.patientDetails.name}</Text>
              <Text style={styles.text}>Birth Year: {report.patientDetails.birthYear}</Text>
              <Text style={styles.text}>Phone Number: {report.patientDetails.phoneNumber}</Text>
            </View>
            <View style={styles.section}>
              <Text style={styles.infoHeader}>{'Medicals Infos'.toUpperCase()}</Text>
              <Text style={styles.text}>Radiologist Name: {report.radiologistName}</Text>
              <Text style={styles.text}>Doctor Name: {report.headDoctorName}</Text>
              <Text style={styles.text}>Date: {formatTimestampToDate(report.createdAt)}</Text>
            </View>
          </View>
          <View style={styles.section}>
            <View style={styles.imageCenter}>
              <Text style={styles.headerTitleCentered}>{studyType}</Text>
              {report.imageUrls.map((url, index) => (
                <Image key={index} src={url} style={styles.image} />
              ))}
            </View>
          </View>
          <View style={styles.section}>
            <Text style={styles.headerTitleCentered}>{'Medical Conclusion'.toUpperCase()}</Text>
            <Text style={styles.text}>{report.conclusionText}</Text>
          </View>
          <View style={styles.section}>
            <Text style={styles.headerTitleCentered}>{'Additional Notes'.toUpperCase()}</Text>
            <Text style={styles.notes}>(use the given blank space to add any additional notes, comments, and sketches)</Text>
            <Text style={styles.border}></Text>
          </View>
        </View>
        <View style={styles.footer}>
          <Text style={styles.footerText}>{disclaimerA}</Text>
          <Text style={styles.footerText}>{disclaimerB + ' ' + report.hospitalDetails.phone}</Text>
        </View>
      </Page>
    </Document>
  )
}

// To store the generated report temporarily
let generatedReport: ReportProps | null = null;

// POST request to generate the report
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from '../../firebaseConfig';

// Initialize Firebase Storage
const storage = getStorage(app);

export async function POST(request: Request) {
  try {
    const body = await request.json(); // Parse the JSON body from the request
    console.log('Received body: ', body);

    const { report }: ReportProps = body; // Destructure the report from the parsed body

    // Generate the PDF stream
    const stream = await renderToStream(<ReportTemplate report={report} />);
    const chunks: Uint8Array[] = [];

    // Collect the chunks from the stream
    stream.on('data', (chunk) => chunks.push(chunk));
    await new Promise((resolve, reject) => {
      stream.on('end', resolve);
      stream.on('error', reject);
    });

    // Convert chunks to a Blob
    const pdfBuffer = Buffer.concat(chunks);
    const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });

    // Create a reference to the Firebase Storage location
    const storageRef = ref(storage, `images/report-${Date.now()}.pdf`);

    // Upload the PDF to Firebase Storage
    await uploadBytes(storageRef, pdfBlob);
    console.log('PDF uploaded to Firebase Storage.');

    // Get the download URL of the uploaded PDF
    const downloadUrl = await getDownloadURL(storageRef);
    console.log('PDF download URL:', downloadUrl);

    return new NextResponse(JSON.stringify({ downloadUrl }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error handling POST request:', error);
    return new NextResponse('Error generating report', { status: 500 });
  }
}

// GET request to fetch and display the generated report
export async function GET(request: Request) {
  if (!generatedReport) {
    return new NextResponse('No report generated yet', { status: 404 });
  }

  try {
    const stream = await renderToStream(<ReportTemplate report={generatedReport.report} />);
    return new NextResponse(stream as unknown as ReadableStream, {
      headers: {
        'Content-Type': 'application/pdf',
      },
    });
  } catch (error) {
    console.error('Error handling GET request:', error);
    return new NextResponse('Error fetching report', { status: 500 });
  }
}