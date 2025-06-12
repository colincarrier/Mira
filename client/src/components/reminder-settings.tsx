import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Settings, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReminderSettings {
  defaultLeadTimes: {
    general: number;
    pickup: number;
    appointment: number;
    medication: number;
    call: number;
    meeting: number;
    flight: number;
  };
  autoArchiveAfterDays: number;
  showOverdueReminders: boolean;
  enablePushNotifications: boolean;
}

const defaultSettings: ReminderSettings = {
  defaultLeadTimes: {
    general: 10,
    pickup: 10,
    appointment: 30,
    medication: 0,
    call: 5,
    meeting: 15,
    flight: 120
  },
  autoArchiveAfterDays: 1,
  showOverdueReminders: true,
  enablePushNotifications: true
};

export function ReminderSettings() {
  const [settings, setSettings] = useState<ReminderSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/user/reminder-settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.reminderSettings || defaultSettings);
      }
    } catch (error) {
      console.error('Failed to load reminder settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/user/reminder-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reminderSettings: settings })
      });

      if (response.ok) {
        toast({
          title: "Settings saved",
          description: "Your reminder preferences have been updated."
        });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save reminder settings.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const updateLeadTime = (category: keyof ReminderSettings['defaultLeadTimes'], value: number) => {
    setSettings(prev => ({
      ...prev,
      defaultLeadTimes: {
        ...prev.defaultLeadTimes,
        [category]: value
      }
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Reminder Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading settings...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Reminder Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Default Lead Times */}
        <div>
          <h3 className="font-medium mb-4">Default Notification Times (minutes before)</h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(settings.defaultLeadTimes).map(([category, minutes]) => (
              <div key={category} className="space-y-2">
                <Label className="capitalize">{category.replace(/([A-Z])/g, ' $1').trim()}</Label>
                <Input
                  type="number"
                  value={minutes}
                  onChange={(e) => updateLeadTime(category as any, parseInt(e.target.value) || 0)}
                  min="0"
                  max="1440"
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Archive Settings */}
        <div className="space-y-4">
          <h3 className="font-medium">Archive Settings</h3>
          <div className="space-y-2">
            <Label>Auto-archive completed reminders after (days)</Label>
            <Input
              type="number"
              value={settings.autoArchiveAfterDays}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                autoArchiveAfterDays: parseInt(e.target.value) || 1
              }))}
              min="0"
              max="30"
              className="w-32"
            />
          </div>
        </div>

        {/* Display Options */}
        <div className="space-y-4">
          <h3 className="font-medium">Display Options</h3>
          <div className="flex items-center justify-between">
            <Label>Show overdue reminders</Label>
            <Switch
              checked={settings.showOverdueReminders}
              onCheckedChange={(checked) => setSettings(prev => ({
                ...prev,
                showOverdueReminders: checked
              }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Enable push notifications</Label>
            <Switch
              checked={settings.enablePushNotifications}
              onCheckedChange={(checked) => setSettings(prev => ({
                ...prev,
                enablePushNotifications: checked
              }))}
            />
          </div>
        </div>

        {/* Save Button */}
        <Button onClick={saveSettings} disabled={saving} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </CardContent>
    </Card>
  );
}