import SiteHeader from "../components/SiteHeader";
import Footer from "../components/Footer";
import StudentLibrary from "../components/StudentLibrary";
export const metadata={title:"My Learning | NovaSprout",description:"Your private saved lessons and learning progress.",robots:{index:false,follow:false}};
export default function LibraryPage(){return <main className="ns-site library-page"><SiteHeader/><StudentLibrary/><Footer/></main>;}
