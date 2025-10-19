import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { driverAuth, DriverSession } from '@/lib/driverAuth';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Upload, Loader2 } from 'lucide-react';

interface DriverTask {
  id: string;
  site_id: string;
  site_name: string;
  scheduled_at: string;
  status: 'pending' | 'in_progress' | 'completed';
  required_liters: number;
  notes?: string;
  created_at: string;
}

interface FuelEntry {
  actual_liters_in_tank: string;
  quantity_added: string;
  observations: string;
  counter_before_url: string;
  tank_before_url: string;
  counter_after_url: string;
  tank_after_url: string;
}

const DRIVER_BUCKET = 'driver-uploads';

export default function DriverMissionDetail() {
  const navigate = useNavigate();
  const { taskId } = useParams<{ taskId: string }>();
  const [session, setSession] = useState<DriverSession | null>(null);
  const [task, setTask] = useState<DriverTask | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});

  const [entry, setEntry] = useState<FuelEntry>({
    actual_liters_in_tank: '',
    quantity_added: '',
    observations: '',
    counter_before_url: '',
    tank_before_url: '',
    counter_after_url: '',
    tank_after_url: '',
  });

  useEffect(() => {
    const initializeSession = async () => {
      try {
        const currentSession = await driverAuth.getSession();
        if (!currentSession) {
          navigate('/driver/login');
          return;
        }
        setSession(currentSession);
        if (taskId) {
          await loadTask(taskId);
        }
      } catch (error) {
        console.error('Session initialization error:', error);
        navigate('/driver/login');
      } finally {
        setIsLoading(false);
      }
    };

    initializeSession();
  }, [navigate, taskId]);

  const loadTask = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('driver_tasks')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error loading task:', error);
        toast({
          title: 'Error',
          description: 'Failed to load task details',
          variant: 'destructive',
        });
        return;
      }

      setTask(data);
    } catch (error) {
      console.error('Failed to load task:', error);
    }
  };

  const handleFileUpload = async (
    fieldKey: keyof FuelEntry,
    file: File
  ) => {
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 10MB',
        variant: 'destructive',
      });
      return;
    }

    setUploading((prev) => ({ ...prev, [fieldKey]: true }));

    try {
      const driverName = session?.name?.replace(/\s+/g, '_') || 'driver';
      const timestamp = Date.now();
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `drivers/${driverName}/${taskId}/${fieldKey}_${timestamp}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(DRIVER_BUCKET)
        .upload(path, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from(DRIVER_BUCKET).getPublicUrl(path);
      const url = data.publicUrl;

      setEntry((prev) => ({
        ...prev,
        [fieldKey]: url,
      }));

      const previewUrl = URL.createObjectURL(file);
      setPreviews((prev) => ({
        ...prev,
        [fieldKey]: previewUrl,
      }));

      toast({
        title: 'Upload successful',
        description: 'Image uploaded successfully',
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setUploading((prev) => ({ ...prev, [fieldKey]: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!task || !session) {
      toast({
        title: 'Error',
        description: 'Missing required information',
        variant: 'destructive',
      });
      return;
    }

    if (!entry.actual_liters_in_tank || !entry.quantity_added) {
      toast({
        title: 'Validation error',
        description: 'Please fill in required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('driver_task_entries').insert({
        driver_id: session.id,
        task_id: task.id,
        site_id: task.site_id,
        actual_liters_in_tank: parseFloat(entry.actual_liters_in_tank),
        quantity_added: parseFloat(entry.quantity_added),
        observations: entry.observations,
        counter_before_url: entry.counter_before_url,
        tank_before_url: entry.tank_before_url,
        counter_after_url: entry.counter_after_url,
        tank_after_url: entry.tank_after_url,
        submitted_at: new Date().toISOString(),
      });

      if (error) {
        throw error;
      }

      await supabase
        .from('driver_tasks')
        .update({ status: 'completed' })
        .eq('id', task.id);

      toast({
        title: 'Success',
        description: 'Fuel entry submitted successfully',
      });

      navigate('/driver/dashboard');
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: 'Submission failed',
        description: 'Failed to submit fuel entry',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-600 mb-4">Task not found</p>
            <Button onClick={() => navigate('/driver/dashboard')}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="border-b bg-white shadow-sm sticky top-0 z-10">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/driver/dashboard')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-gray-900">
                Mission Details
              </h1>
              <p className="text-sm text-gray-600">{task.site_name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Task Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Task Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-xs text-gray-600 uppercase">Site Name</Label>
                <p className="font-semibold text-gray-900">{task.site_name}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-600 uppercase">Site ID</Label>
                <p className="font-semibold text-gray-900">{task.site_id}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-600 uppercase">Scheduled Date</Label>
                <p className="font-semibold text-gray-900">
                  {new Date(task.scheduled_at).toLocaleString()}
                </p>
              </div>
              <div>
                <Label className="text-xs text-gray-600 uppercase">Required Liters</Label>
                <p className="font-semibold text-gray-900">{task.required_liters}L</p>
              </div>
            </div>
            {task.notes && (
              <div>
                <Label className="text-xs text-gray-600 uppercase">Notes</Label>
                <p className="text-gray-900">{task.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fuel Entry Form */}
        <Card>
          <CardHeader>
            <CardTitle>Fuel Entry</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Fuel Quantities */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Fuel Quantities</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="actual_liters">
                      Actual Liters in Tank *
                    </Label>
                    <Input
                      id="actual_liters"
                      type="number"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={entry.actual_liters_in_tank}
                      onChange={(e) =>
                        setEntry((prev) => ({
                          ...prev,
                          actual_liters_in_tank: e.target.value,
                        }))
                      }
                      disabled={isSubmitting}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="quantity_added">Quantity Added *</Label>
                    <Input
                      id="quantity_added"
                      type="number"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={entry.quantity_added}
                      onChange={(e) =>
                        setEntry((prev) => ({
                          ...prev,
                          quantity_added: e.target.value,
                        }))
                      }
                      disabled={isSubmitting}
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>

              {/* Images */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Evidence Photos</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {([
                    { key: 'counter_before_url' as const, label: 'Counter Before' },
                    { key: 'tank_before_url' as const, label: 'Tank Before' },
                    { key: 'counter_after_url' as const, label: 'Counter After' },
                    { key: 'tank_after_url' as const, label: 'Tank After' },
                  ] as const).map(({ key, label }) => (
                    <div key={key}>
                      <Label className="text-sm">{label}</Label>
                      <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-4">
                        <Input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          disabled={isSubmitting}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileUpload(key, file);
                            }
                          }}
                          className="hidden"
                          id={key}
                        />
                        <label htmlFor={key} className="flex flex-col items-center gap-2 cursor-pointer">
                          {previews[key] || entry[key] ? (
                            <div className="w-full">
                              <img
                                src={previews[key] || entry[key]}
                                alt={label}
                                className="h-32 w-full object-cover rounded"
                              />
                              {uploading[key] && (
                                <p className="text-xs text-gray-600 mt-2">Uploading...</p>
                              )}
                            </div>
                          ) : (
                            <>
                              <Upload className="h-6 w-6 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                {uploading[key] ? 'Uploading...' : 'Click to upload'}
                              </span>
                            </>
                          )}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Observations */}
              <div>
                <Label htmlFor="observations">Observations</Label>
                <Textarea
                  id="observations"
                  placeholder="Add any observations or notes..."
                  value={entry.observations}
                  onChange={(e) =>
                    setEntry((prev) => ({
                      ...prev,
                      observations: e.target.value,
                    }))
                  }
                  disabled={isSubmitting}
                  className="mt-2"
                  rows={4}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/driver/dashboard')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isSubmitting ? 'Submitting...' : 'Submit Entry'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
