'use client';

import Image from 'next/image';
import { useWatchlist } from '@/context/watchlist-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { XCircle } from 'lucide-react';
import { getPosterUrl } from '@/lib/image-utils';

export default function SettingsPage() {
  const { watchlist, removeFromWatchlist } = useWatchlist();

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-headline mb-8">Settings</h1>
      <Tabs defaultValue="watchlist" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-secondary">
          <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>
        <TabsContent value="watchlist">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">My Watchlist</CardTitle>
            </CardHeader>
            <CardContent>
              {watchlist.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {watchlist.map((movie) => (
                    <div key={movie.id} className="relative group">
                      <Image
                        src={getPosterUrl(movie.poster_path)}
                        alt={`Poster for ${movie.title}`}
                        width={200}
                        height={300}
                        className="rounded-md w-full"
                      />
                       <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center">
                        <p className="text-white font-bold">{movie.title}</p>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="mt-2"
                          onClick={() => removeFromWatchlist(movie.id)}
                        >
                           <XCircle className="w-4 h-4 mr-2" />
                           Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">Your watchlist is empty. Start swiping to add movies!</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Content Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
                <Label htmlFor="recommendations-mode" className="flex flex-col space-y-1">
                  <span>Enable New Recommendations</span>
                  <span className="font-normal leading-snug text-muted-foreground">
                    Get notifications about new movies you might like.
                  </span>
                </Label>
                <Switch id="recommendations-mode" defaultChecked/>
              </div>
              <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
                <Label htmlFor="autoplay-mode" className="flex flex-col space-y-1">
                  <span>Autoplay Trailers</span>
                  <span className="font-normal leading-snug text-muted-foreground">
                    Automatically play trailers in the detail view.
                  </span>
                </Label>
                <Switch id="autoplay-mode" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Account Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" defaultValue="Alex Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="alex.doe@example.com" />
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
