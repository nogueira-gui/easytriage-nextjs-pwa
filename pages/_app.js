import { FormProvider } from "@/context/FormContext";
import "@/styles/globals.css";
import VoiceInputButton from "@/components/VoiceInputButton";
import QuestionDisplay from "@/components/QuestionDisplay";

export default function App({ Component, pageProps }) {
  return (
    <FormProvider>
      <main>
        <VoiceInputButton />
        {/* <QuestionDisplay /> */}
        <Component {...pageProps} />
      </main>
    </FormProvider>
  );
}
