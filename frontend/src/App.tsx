import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from './wagmi'
import Terminal from './components/Terminal'

const queryClient = new QueryClient()

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <div className="bg-black min-h-screen selection:bg-[#00ff88] selection:text-black">
          <Terminal />
        </div>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App
