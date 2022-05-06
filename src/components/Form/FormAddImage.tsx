import { Box, Button, Stack, useToast } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';

import { api } from '../../services/api';
import { FileInput } from '../Input/FileInput';
import { TextInput } from '../Input/TextInput';

const MAX_FILE_SIZE = 1024 * 1024 * 10; // 10mb

const ACCEPTED_FILE_TYPES_REGEX = /(png|jpeg|gif)$/i;

const formValidations = {
  image: {
    required: 'Arquivo obrigatório',
    validate: {
      lessThan10MB: file =>
        file[0].size < MAX_FILE_SIZE || 'O arquivo deve ser menor que 10MB',
      acceptedFormats: file =>
        ACCEPTED_FILE_TYPES_REGEX.test(file[0].type) ||
        `Somente são aceitos arquivos PNG, JPEG e GIF`,
    },
  },
  title: {
    required: 'Título obrigatório',
    validate: {
      minLength: v => v.length >= 2 || 'Mínimo de 2 caracteres',
      maxLength: v => v.length <= 20 || 'Máximo de 20 caracteres',
    },
  },
  description: {
    required: 'Descrição obrigatória',
    validate: {
      maxLength: v => v.length <= 65 || 'Máximo de 65 caracteres',
    },
  },
};

type FormData = {
  url: string;
  title: string;
  description: string;
};

interface FormAddImageProps {
  closeModal: () => void;
}

export function FormAddImage({ closeModal }: FormAddImageProps): JSX.Element {
  const [imageUrl, setImageUrl] = useState('');
  const [localImageUrl, setLocalImageUrl] = useState('');
  const toast = useToast();
  const queryClient = useQueryClient();
  const mutation = useMutation(
    async (values: FormData) => api.post('api/images', values),
    {
      onSuccess: () => queryClient.invalidateQueries('images'),
    }
  );

  const { register, handleSubmit, reset, formState, setError, trigger } =
    useForm();
  const { errors, isSubmitting } = formState;

  const onSubmit = async (data: FormData): Promise<void> => {
    try {
      if (!imageUrl) {
        toast({
          title: 'Imagem não adicionada',
          description:
            'É preciso adicionar e aguardar o upload de uma imagem antes de realizar o cadastro.',
          status: 'error',
        });
        return;
      }

      const { title, description } = data;

      await mutation.mutateAsync({
        title,
        description,
        url: imageUrl,
      });

      toast({
        title: 'Imagem cadastrada',
        description: 'Sua imagem foi cadastrada com sucesso.',
        status: 'success',
      });
    } catch (error) {
      console.log(error);
      toast({
        title: 'Falha no cadastro',
        description: 'Ocorreu um erro ao tentar cadastrar a sua imagem.',
        status: 'error',
      });
    } finally {
      setImageUrl('');
      setLocalImageUrl('');
      reset();
      closeModal();
    }
  };

  return (
    <Box as="form" width="100%" onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={4}>
        <FileInput
          setImageUrl={setImageUrl}
          localImageUrl={localImageUrl}
          setLocalImageUrl={setLocalImageUrl}
          setError={setError}
          trigger={trigger}
          error={errors.image}
          {...register('image', formValidations.image)}
        />

        <TextInput
          placeholder="Título da imagem..."
          error={errors.title}
          {...register('title', formValidations.title)}
        />

        <TextInput
          placeholder="Descrição da imagem..."
          error={errors.description}
          {...register('description', formValidations.description)}
        />
      </Stack>

      <Button
        my={6}
        isLoading={isSubmitting}
        isDisabled={isSubmitting}
        type="submit"
        w="100%"
        py={6}
      >
        Enviar
      </Button>
    </Box>
  );
}
