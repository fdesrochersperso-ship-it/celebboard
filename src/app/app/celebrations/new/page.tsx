import { Suspense } from 'react'
import { NewCelebrationContent } from './new-celebration-content'

export default function NewCelebrationPage() {
  return (
    <Suspense
      fallback={
        <div>
          <h1 className="mb-2 text-2xl font-semibold">Create Celebration</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <NewCelebrationContent />
    </Suspense>
  )
}
