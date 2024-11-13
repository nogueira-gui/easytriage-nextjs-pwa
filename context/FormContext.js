import React, { createContext, useContext, useState } from 'react';

const FormContext = createContext();

export const FormProvider = ({ children }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [listening, setListening] = useState(false);

  const questions = [
    'NOME',
    'IDADE',
    'MEDICAMENTO_DE_USO_CONTINUO',
    'ALERGIAS',
    'DOENCAS_CRONICAS',
    'SINTOMAS',
    'COMPLEMENTAR',
    'RESULTADO'
  ];

  const handleNextQuestion = (response) => {
    setAnswers((prev) => ({ ...prev, [currentStep]: response }));
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  return (
    <FormContext.Provider value={{ currentStep, questions, handleNextQuestion, listening, setListening }}>
      {children}
    </FormContext.Provider>
  );
};

export const useForm = () => useContext(FormContext);
