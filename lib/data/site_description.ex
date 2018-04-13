require Logger

defmodule Data.SiteDescription do
  use Agent

  @name __MODULE__
  @user_agent_pls_no_fbi "Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:47.0) Gecko/20100101 Firefox/47.0"
  @timeout_ms 3_000
  @error_message "Failed to find description"

  ##############
  # PUBLIC API #
  ##############
  def start_link([]) do
    Agent.start_link(fn ->
      {:ok, @name} = Util.PersistentCache.load(@name)
      :ok
    end)
  end

  def get_site_description(url) do
    case Util.PersistentCache.get(@name, url) do
      nil ->
        update_cache_and_return_description(url)

      description ->
        Logger.info("Serving '#{url}' - Site description - from cache")
        description
    end
  end

  defp update_cache_and_return_description(url) do
    Logger.info("Cache miss - '#{url}' - Site description - Fetching.")

    case get_blurb(url) do
      {:ok, description} ->
        Util.PersistentCache.put(@name, url, description)
        Logger.info("Serving '#{url}' - Site description - from cache")
        description

      {:error, error_message} ->
        Logger.info("Failed to find '#{url}'")
        error_message
    end
  end

  def get_description(html) do
    case Floki.find(html, "meta[name=description]") do
      tags = [_] ->
        content = Floki.attribute(tags, "content")
        hd(content)

      _ ->
        nil
    end
  end

  defp get_title(html) do
    case Floki.find(html, "title") do
      [{_, _, title}] ->
        title

      _ ->
        nil
    end
  end

  def get_blurb(site) do
    case HTTPoison.get(
           "#{site}",
           %{"User-Agent" => @user_agent_pls_no_fbi},
           recv_timeout: @timeout_ms,
           follow_redirect: true
         ) do
      {:ok, site_content} ->
        body = Map.get(site_content, :body)

        case get_description(body) || get_title(body) do
          nil -> {:error, @error_message}
          description -> {:ok, description}
        end

      _ ->
        {:error, @error_message}
    end
  end
end
