import { createApp } from './create-app'

const { app } = createApp()

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})

export default app
