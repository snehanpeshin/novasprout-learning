import SiteHeader from "../../components/SiteHeader";
import Footer from "../../components/Footer";
import SavedLessonReader from "../../components/SavedLessonReader";
export const metadata={title:"Continue Learning | NovaSprout",robots:{index:false,follow:false}};
export default async function SavedLessonPage({params}:{params:Promise<{lessonId:string}>}){const {lessonId}=await params;return <main className="ns-site library-page"><SiteHeader/><SavedLessonReader lessonId={lessonId}/><Footer/></main>;}
