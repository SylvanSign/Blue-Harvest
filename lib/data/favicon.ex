require Logger

defmodule Data.Favicon do
  use GenServer

  @name __MODULE__
  @state_file "data/#{@name}.state"
  @user_agent_pls_no_fbi "Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:47.0) Gecko/20100101 Firefox/47.0"
  @timeout_ms 100_000

  ##############
  # PUBLIC API #
  ##############
  def start_link([]) do
    GenServer.start_link(@name, :ok, name: @name)
  end

  def get_site_image(url) do
    GenServer.call(@name, {:get_image, url})
  end

  # TODO remove this function after thouroughly testing this module
  def inspect_state do
    GenServer.call(@name, :inspect)
  end

  ####################
  # SERVER CALLBACKS #
  ####################
  def init(:ok) do
    state = load_state()

    {:ok, state}
  end

  def handle_call({:get_image, url}, _from, images) do
    case Map.get(images, url) do
      nil ->
        Logger.info("Cache miss - '#{url}' - Image - Fetching.")

        case get_image(url) do
          {:ok, image} ->
            images = Map.put(images, url, image)
            save_state(images)
            {:reply, image, images}

          {:error, error_message} ->
            Logger.info("Failed to find image for '#{url}'")
            {:reply, error_message, images}
        end

      image ->
        Logger.info("Serving '#{url}' - Image - from cache")
        {:reply, image, images}
    end
  end

  def handle_call(:inspect, _from, state) do
    {:reply, state, state}
  end

  ###################
  # PRIVATE HELPERS #
  ###################
  defp load_state() do
    case File.read(@state_file) do
      {:ok, saved_state} -> :erlang.binary_to_term(saved_state)
      {:error, :enoent} -> %{}
    end
  end

  defp save_state(state) do
    binary_state = :erlang.term_to_binary(state)
    File.write!(@state_file, binary_state)
  end

  defp get_image(url) do
    search_url = ["http://www.google.com/s2/favicons?domain=", url]

    case HTTPoison.get(
           "#{search_url}",
           %{"User-Agent" => @user_agent_pls_no_fbi},
           recv_timeout: @timeout_ms,
           follow_redirect: true
         ) do
      {:ok, content} ->
        image = Map.get(content, :body)
        {:ok, image}

      _ ->
        {:error, "Failed to find suitable image"}
    end
  end
end
