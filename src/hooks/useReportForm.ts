import { useState } from 'react';
import { formatDateTime } from '@/utils/format';
import { maskCep, maskDateTime, maskHeight } from '@/utils/masks';
import {
  parseDateTime,
  validateCep,
  validateDateTime,
  validateHeight,
  type Validation,
} from '@/utils/validators';
import { pilotPoint } from '@/data/pilotPoint';
import type { NewReportInput } from '@/services/reportService';

type Field = 'cep' | 'dataHora' | 'altura';

/** Estado, máscaras e validação do formulário "Relatar observação". */
export function useReportForm() {
  const [cep, setCepState] = useState<string>(pilotPoint.cep);
  const [dataHora, setDataHoraState] = useState(() => formatDateTime(new Date()));
  const [altura, setAlturaState] = useState('');
  const [descricao, setDescricao] = useState('');
  const [errors, setErrors] = useState<Partial<Record<Field, Validation>>>({});

  const clear = (f: Field) => setErrors((e) => ({ ...e, [f]: null }));

  const validate = (): boolean => {
    const next = {
      cep: validateCep(cep),
      dataHora: validateDateTime(dataHora),
      altura: validateHeight(altura),
    };
    setErrors(next);
    return !next.cep && !next.dataHora && !next.altura;
  };

  /** Devolve os dados prontos para gravar, ou null se houver erro no formulário. */
  const submit = (): Omit<NewReportInput, 'autorId'> | null => {
    if (!validate()) return null;
    return {
      cep,
      observadoEm: parseDateTime(dataHora) as Date,
      alturaCm: Number(altura),
      descricao,
    };
  };

  const reset = () => {
    setCepState(pilotPoint.cep);
    setDataHoraState(formatDateTime(new Date()));
    setAlturaState('');
    setDescricao('');
    setErrors({});
  };

  return {
    cep,
    dataHora,
    altura,
    descricao,
    errors,
    setCep: (v: string) => {
      setCepState(maskCep(v));
      clear('cep');
    },
    setDataHora: (v: string) => {
      setDataHoraState(maskDateTime(v));
      clear('dataHora');
    },
    setAltura: (v: string) => {
      setAlturaState(maskHeight(v));
      clear('altura');
    },
    setDescricao,
    submit,
    reset,
  };
}
