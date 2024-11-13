import React from 'react';
import { useForm } from '@/context/FormContext';

const QuestionDisplay = () => {
  const { currentStep, questions } = useForm();

  return (
    <div style={{ textAlign: 'center', marginTop: '30%' }}>
      <h2>{questions[currentStep]}</h2>
    </div>
  );
};

export default QuestionDisplay;
