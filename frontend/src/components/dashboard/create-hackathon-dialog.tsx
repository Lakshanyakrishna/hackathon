import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { hackathonService } from '@/services/hackathons';

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  mode: z.enum(['ONLINE', 'OFFLINE', 'HYBRID']),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  registrationDeadline: z.string().min(1, 'Registration deadline is required'),
  registrationFee: z.string(),
  minTeamSize: z.string(),
  maxTeamSize: z.string(),
});

type FormData = z.infer<typeof schema>;

interface CreateHackathonDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CreateHackathonDialog({ open, onClose }: CreateHackathonDialogProps) {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      mode: 'ONLINE',
      registrationFee: '0',
      minTeamSize: '1',
      maxTeamSize: '4',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      setError('');
      const payload: Record<string, unknown> = {
        title: data.title,
        description: data.description,
        mode: data.mode,
        startDate: data.startDate,
        endDate: data.endDate,
        registrationDeadline: data.registrationDeadline,
        registrationFee: parseFloat(data.registrationFee) || 0,
        minTeamSize: parseInt(data.minTeamSize, 10) || 1,
        maxTeamSize: parseInt(data.maxTeamSize, 10) || 4,
      };
      const res = await hackathonService.create(payload as any);
      onClose();
      navigate(`/organize/${res.data.slug}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create hackathon');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create Hackathon" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="rounded-md bg-error-bg px-4 py-3 text-sm text-error">{error}</div>
        )}

        <Input label="Title" placeholder="e.g. AI Hackathon 2026" error={errors.title?.message} {...register('title')} />

        <Textarea label="Description" placeholder="Describe your hackathon" error={errors.description?.message} {...register('description')} />

        <div className="grid grid-cols-2 gap-4">
          <Input label="Start Date" type="date" error={errors.startDate?.message} {...register('startDate')} />
          <Input label="End Date" type="date" error={errors.endDate?.message} {...register('endDate')} />
        </div>

        <Input label="Registration Deadline" type="date" error={errors.registrationDeadline?.message} {...register('registrationDeadline')} />

        <div className="grid grid-cols-3 gap-4">
          <Input label="Registration Fee (₹)" type="number" min={0} error={errors.registrationFee?.message} {...register('registrationFee')} />
          <Input label="Min Team Size" type="number" min={1} error={errors.minTeamSize?.message} {...register('minTeamSize')} />
          <Input label="Max Team Size" type="number" min={1} max={20} error={errors.maxTeamSize?.message} {...register('maxTeamSize')} />
        </div>

        <Select
          label="Mode"
          options={[
            { label: 'Online', value: 'ONLINE' },
            { label: 'Offline', value: 'OFFLINE' },
            { label: 'Hybrid', value: 'HYBRID' },
          ]}
          error={errors.mode?.message}
          {...register('mode')}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isSubmitting}>Create Hackathon</Button>
        </div>
      </form>
    </Modal>
  );
}